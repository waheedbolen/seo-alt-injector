export default {
  async fetch(request, env) {
    const script = `
console.log(\"✅ SEO Alt Injector script loaded\");

// Main function to process images
async function processImages() {
  console.log(\"✅ Processing images...\");
  
  // Create a unique identifier for each image based on multiple properties
  function createImageFingerprint(img) {
    // Get basic image properties
    const src = img.currentSrc || img.src;
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    
    // Extract the base path without query parameters and hash
    const basePath = src.split(\"?\")[0].split(\"#\")[0];
    
    // Extract the filename from the path
    const filename = basePath.split(\"/\").pop();
    
    // Combine all factors into a fingerprint
    return {
      // Primary identifier - normalized URL without query params
      normalizedSrc: basePath,
      // Secondary identifier - filename only
      filename: filename,
      // Tertiary identifier - dimensions if available
      dimensions: width && height ? (width + \"x\" + height) : \"\",
      // Original full URL for reference
      originalSrc: src
    };
  }
  
  // Function to find the best match between two image fingerprints
  function calculateMatchScore(fingerprint1, fingerprint2) {
    let score = 0;
    
    // Exact normalized URL match is strongest
    if (fingerprint1.normalizedSrc === fingerprint2.normalizedSrc) {
      score += 100;
    }
    
    // Filename match is next strongest
    if (fingerprint1.filename === fingerprint2.filename) {
      score += 50;
    }
    
    // If dimensions match and are available, that's a good signal
    if (fingerprint1.dimensions && fingerprint2.dimensions && 
        fingerprint1.dimensions === fingerprint2.dimensions) {
      score += 25;
    }
    
    // If original URLs contain each other (partial match)
    if (fingerprint1.originalSrc.includes(fingerprint2.normalizedSrc) || 
        fingerprint2.originalSrc.includes(fingerprint1.normalizedSrc)) {
      score += 5;
    }
    
    return score;
  }
  
  // Find eligible images (no alt or alt less than 150 chars)
  const eligibleImages = Array.from(document.querySelectorAll(\"img\")).filter((img) => {
    const alt = img.getAttribute(\"alt\");
    return !alt || alt.trim().length === 0 || alt.trim().length < 150;
  });
  
  console.log(\"🖼️ Images eligible for alt:\", eligibleImages.length);
  if (eligibleImages.length === 0) return;
  
  // Create fingerprints for all eligible images
  const imageFingerprints = eligibleImages.map(img => ({
    img: img,
    fingerprint: createImageFingerprint(img)
  }));
  
  // Prepare request data for the API
  const requestData = eligibleImages.map((img) => ({
    src: img.currentSrc || img.src,
    context: img.getAttribute(\"data-context\") || \"\",
  }));
  
  // Try to fetch existing alt texts from KV
  let kvData = [];
  try {
    // Add CORS mode and credentials
    const kvResponse = await fetch(\"add_cloudflare_wroker_url_for_seo_alt_dashboard_here", {
      method: \"GET\",
      headers: {
        \"Content-Type\": \"application/json\",
        \"x-api-key\": \"sk1dashboard_sk_927af283hjfw9834g\"
      },
      mode: \"cors\",
      credentials: \"omit\"
    });
    
    if (kvResponse.ok) {
      kvData = await kvResponse.json();
      console.log(\"📦 Fetched KV data:\", kvData.length, \"entries\");
    } else {
      console.warn(\"⚠️ KV fetch failed with status:\", kvResponse.status);
    }
  } catch (err) {
    console.warn(\"⚠️ KV fetch failed, will fallback to full generation\", err);
  }
  
  // Create fingerprints for KV entries
  const kvFingerprints = kvData.map(entry => ({
    entry: entry,
    fingerprint: {
      normalizedSrc: entry.image.split(\"?\")[0].split(\"#\")[0],
      filename: entry.image.split(\"?\")[0].split(\"#\")[0].split(\"/\").pop(),
      dimensions: \"\",
      originalSrc: entry.image
    }
  }));
  
  // Match images with KV data using fingerprints
  const imagesToGenerate = [];
  
  for (const imgData of imageFingerprints) {
    let bestMatch = null;
    let bestScore = 0;
    
    // Find the best matching KV entry
    for (const kvItem of kvFingerprints) {
      const score = calculateMatchScore(imgData.fingerprint, kvItem.fingerprint);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = kvItem.entry;
      }
    }
    
    // If we have a good match (score threshold), use it
    if (bestMatch && bestScore >= 50) {
      imgData.img.alt = bestMatch.alt;
      imgData.img.setAttribute(\"data-alt-generated\", \"true\");
      imgData.img.setAttribute(\"data-alt-match-score\", bestScore);
      console.log(\"✅ Injected from KV (score \" + bestScore + \"):\", bestMatch.alt);
    } else {
      // Otherwise, add to generation queue
      imagesToGenerate.push({
        src: imgData.img.currentSrc || imgData.img.src,
        context: imgData.img.getAttribute(\"data-context\") || \"\",
        fingerprint: imgData.fingerprint
      });
    }
  }
  
  // Generate new alt texts if needed
  if (imagesToGenerate.length > 0) {
    console.log(\"✏️ Generating new alts for:\", imagesToGenerate.length);
    try {
      const genResponse = await fetch(\"add_cloudflare_url_to_seo_alt_agent_here", {
        method: \"POST\",
        headers: {
          \"Content-Type\": \"application/json\"
        },
        body: JSON.stringify({
          images: imagesToGenerate.map(item => ({
            src: item.src,
            context: item.context
          })),
          vision: true
        }),
        mode: \"cors\",
        credentials: \"omit\"
      });
      
      if (!genResponse.ok) {
        throw new Error(\"Agent response not OK: \" + genResponse.status);
      }
      
      const genResult = await genResponse.json();
      console.log(\"📝 Received generated alts:\", Object.keys(genResult).length);
      
      // Debug: Log all received image URLs
      console.log(\"🔍 Debug - Received image URLs:\", Object.keys(genResult));
      
      // Debug: Log all eligible image fingerprints
      console.log(\"🔍 Debug - Eligible image fingerprints:\", 
        imageFingerprints.map(item => ({
          normalizedSrc: item.fingerprint.normalizedSrc,
          filename: item.fingerprint.filename
        }))
      );
      
      // Match generated alts back to images
      let matchedCount = 0;
      for (const [src, alt] of Object.entries(genResult)) {
        // Skip empty or error alts
        if (!alt || alt.includes(\"Error processing image\")) {
          console.warn(\"⚠️ Skipping invalid alt text for:\", src);
          continue;
        }
        
        // Create a fingerprint for the response
        const normalizedSrc = src.split(\"?\")[0].split(\"#\")[0];
        const filename = normalizedSrc.split(\"/\").pop();
        
        const responseFp = {
          normalizedSrc: normalizedSrc,
          filename: filename,
          dimensions: \"\",
          originalSrc: src
        };
        
        // Find best matching image for this result
        let bestImg = null;
        let bestScore = 0;
        let bestImgData = null;
        
        for (const imgData of imageFingerprints) {
          // Skip images that already have alt text
          if (imgData.img.getAttribute(\"data-alt-generated\") === \"true\") continue;
          
          const score = calculateMatchScore(imgData.fingerprint, responseFp);
          
          // Debug: Log match attempts
          console.log(\"🔍 Match attempt - Score: \" + score + 
                     \" | Response: \" + responseFp.filename + 
                     \" | Image: \" + imgData.fingerprint.filename);
          
          if (score > bestScore) {
            bestScore = score;
            bestImg = imgData.img;
            bestImgData = imgData;
          }
        }
        
        if (bestImg && bestScore >= 30) {
          bestImg.alt = alt;
          bestImg.setAttribute(\"data-alt-generated\", \"true\");
          bestImg.setAttribute(\"data-alt-match-score\", bestScore);
          console.log(\"✅ Injected NEW alt (score \" + bestScore + \"):\", alt);
          matchedCount++;
        } else {
          // Try a more aggressive matching approach as fallback
          // Match by filename only if no match was found
          for (const imgData of imageFingerprints) {
            if (imgData.img.getAttribute(\"data-alt-generated\") === \"true\") continue;
            
            if (imgData.fingerprint.filename === filename) {
              imgData.img.alt = alt;
              imgData.img.setAttribute(\"data-alt-generated\", \"true\");
              imgData.img.setAttribute(\"data-alt-match-score\", \"filename-only\");
              console.log(\"✅ Injected NEW alt (filename match):\", alt);
              matchedCount++;
              break;
            }
          }
          
          if (matchedCount === 0) {
            console.warn(\"⚠️ Couldn't find matching image in DOM for:\", src);
          }
        }
      }
      
      // If no matches were found, try a last resort approach
      if (matchedCount === 0 && Object.keys(genResult).length > 0) {
        console.log(\"⚠️ No matches found with standard algorithm, trying last resort matching...\");
        
        // Get all images without alt text
        const remainingImages = imageFingerprints.filter(
          imgData => !imgData.img.getAttribute(\"data-alt-generated\")
        );
        
        // Get all generated alts
        const remainingAlts = Object.entries(genResult)
          .filter(([_, alt]) => alt && !alt.includes(\"Error\"))
          .map(([src, alt]) => ({ src, alt }));
        
        // Assign alts to images in order (last resort)
        for (let i = 0; i < Math.min(remainingImages.length, remainingAlts.length); i++) {
          remainingImages[i].img.alt = remainingAlts[i].alt;
          remainingImages[i].img.setAttribute(\"data-alt-generated\", \"true\");
          remainingImages[i].img.setAttribute(\"data-alt-match-score\", \"last-resort\");
          console.log(\"✅ Injected NEW alt (last resort):\", remainingAlts[i].alt);
          matchedCount++;
        }
      }
    } catch (err) {
      console.error(\"❌ Failed to generate alt texts:\", err);
    }
  }
  
  // Log statistics
  const generatedCount = document.querySelectorAll(\"[data-alt-generated=\\\"true\\\"]\").length;
  console.log(\"🔍 Alt text generation complete. \" + generatedCount + \"/\" + eligibleImages.length + \" images processed.\");
}

// Run on initial page load
document.addEventListener(\"DOMContentLoaded\", processImages);

// Set up a MutationObserver to detect DOM changes that might indicate SPA navigation
const observer = new MutationObserver((mutations) => {
  // Check if new images have been added
  let newImagesAdded = false;
  
  for (const mutation of mutations) {
    if (mutation.type === \"childList\") {
      // Check if any new nodes are images or contain images
      const hasNewImages = Array.from(mutation.addedNodes).some(node => {
        // Check if the node is an image
        if (node.nodeName === \"IMG\") {
          return true;
        }
        
        // Check if the node contains images
        if (node.querySelectorAll) {
          return node.querySelectorAll(\"img\").length > 0;
        }
        
        return false;
      });
      
      if (hasNewImages) {
        newImagesAdded = true;
        break;
      }
    }
  }
  
  // If new images were added, process them after a short delay
  // The delay ensures the images are fully loaded
  if (newImagesAdded) {
    console.log(\"🔄 New images detected, re-processing...\");
    clearTimeout(window.seoAltInjectorTimeout);
    window.seoAltInjectorTimeout = setTimeout(processImages, 500);
  }
});

// Start observing the document with the configured parameters
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Also listen for URL changes (for SPAs that use History API)
let lastUrl = location.href;
window.addEventListener(\"popstate\", () => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    console.log(\"🔄 URL changed from\", lastUrl, \"to\", currentUrl);
    lastUrl = currentUrl;
    
    // Wait a moment for the DOM to update
    setTimeout(processImages, 1000);
  }
});

// For SPAs that use hash-based routing
window.addEventListener(\"hashchange\", () => {
  console.log(\"🔄 Hash changed, re-processing images...\");
  setTimeout(processImages, 1000);
});

// For search input events specific to this application
document.addEventListener(\"click\", (event) => {
  // Check if the clicked element is a search button or related element
  if (event.target.closest(\"form\") || 
      event.target.closest(\"[type=search]\") || 
      event.target.closest(\"[type=submit]\")) {
    console.log(\"🔍 Search interaction detected, will check for new images...\");
    // Wait for the search results to load
    setTimeout(processImages, 1500);
  }
});

console.log(\"✅ SEO Alt Injector initialized with SPA support\");
`;

    return new Response(script, {
      headers: {
        "Content-Type": "application/javascript",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-api-key"
      }
    });
  }
};
