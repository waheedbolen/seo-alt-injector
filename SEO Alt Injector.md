# SEO Alt Injector

A lightweight, high-performance JavaScript solution for automatically generating and injecting SEO-friendly alt text for images on any website.

## Overview

SEO Alt Injector is a client-side script that scans your web pages for images without alt text (or with insufficient alt text), generates descriptive alt text using AI, and injects it directly into the DOM. This improves your website's accessibility, SEO performance, and user experience without requiring any changes to your existing content management workflow.

## Features

- 🔍 **Automatic Detection**: Identifies images missing proper alt text
- 🤖 **AI-Powered Generation**: Creates contextually relevant, SEO-friendly alt text
- 💾 **Smart Caching**: Stores generated alt text to reduce API calls
- 📱 **SPA Support**: Works with Single-Page Applications and dynamic content
- 🔄 **Robust Matching**: Uses advanced fingerprinting to reliably match images
- 🚀 **Performance Optimized**: Minimal impact on page load and rendering

## How It Works

The SEO Alt Injector operates in three main steps:

1. **Detection**: Scans the page for images with missing or insufficient alt text
2. **Generation**: For images needing alt text, sends them to an AI service for processing
3. **Injection**: Applies the generated alt text directly to the images in the DOM

The system uses a sophisticated image fingerprinting algorithm to ensure reliable matching between images and their generated alt text, even when URLs contain changing query parameters or CDN modifications.

### Technical Architecture

The solution consists of three components:

1. **Injector Script**: Client-side JavaScript that runs in the browser
2. **Alt Text Generator API**: Serverless function that generates alt text using AI
3. **KV Storage**: Key-value store that caches generated alt text for reuse

## Installation

### Basic Setup

Add the following script tag to your website's `<head>` section:

```html
<script src="https://your-cdn-or-server.com/seo-alt-injector.js" defer></script>
```

### Advanced Setup (Self-hosted)

1. Deploy the Alt Text Generator API to your preferred serverless platform
2. Set up a KV storage solution (e.g., Cloudflare KV, Redis, DynamoDB)
3. Configure the Injector Script with your API endpoints
4. Host the Injector Script on your CDN or server
5. Add the script to your website

## Configuration

The SEO Alt Injector can be configured by setting options before the script loads:

```html
<script>
  window.seoAltInjectorConfig = {
    apiEndpoint: "https://your-api-endpoint.com/generate",
    kvEndpoint: "https://your-kv-endpoint.com/kv",
    apiKey: "your-api-key",
    minAltLength: 150,
    debug: false
  };
</script>
<script src="https://your-cdn-or-server.com/seo-alt-injector.js" defer></script>
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiEndpoint` | String | - | URL of the alt text generation API |
| `kvEndpoint` | String | - | URL of the KV storage API |
| `apiKey` | String | - | API key for authentication |
| `minAltLength` | Number | 150 | Minimum character length for existing alt text to be considered sufficient |
| `debug` | Boolean | false | Enable detailed console logging |

## Customization

### Custom Context

You can provide additional context for specific images to improve alt text generation:

```html
<img src="product.jpg" data-context="Red leather office chair with ergonomic design" />
```

### Styling Indicators

During development, you can visualize which images have generated alt text:

```css
img[data-alt-generated="true"] {
  border: 2px solid green;
}
```

## SPA Support

The SEO Alt Injector fully supports Single-Page Applications and dynamically loaded content through:

- MutationObserver to detect DOM changes
- History API monitoring for URL changes
- Hash-based routing support
- Event listeners for user interactions

This ensures that all images receive appropriate alt text regardless of how or when they're loaded into the page.

## Performance Considerations

The SEO Alt Injector is designed to have minimal impact on page performance:

- Deferred script loading
- Asynchronous processing
- Smart debouncing to prevent excessive API calls
- Efficient DOM operations
- Caching of generated alt text

## Browser Compatibility

The SEO Alt Injector works in all modern browsers:

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 16+

## Development

### Prerequisites

- Node.js 14+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/seo-alt-injector.git

# Install dependencies
cd seo-alt-injector
npm install

# Build the project
npm run build
```

### Testing

```bash
# Run tests
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- OpenAI for the vision-based alt text generation
- Cloudflare Workers for serverless API hosting
