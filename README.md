# particle

The one bookmark you need.


## Overview

Particle is a customizable dashboard that aggregates links to your favorite web services. It allows you to quickly access all your tools from a single page. It loads the service with an iframe, so you can interact with it without leaving the dashboard. The iframe state is preserved when switching between services, so you can pick up where you left off.

## Configuration

```json
{
  "services": [
    {
      "name": "Service Name",
      "icon": "static/icon.png",
      "link": "http://myservice.home.mydomain.tld:PORT"
    }
  ]
}
```

### Icons

Any paths to icons are supported:

- **Local relative:** `"static/icon.png"`, `"images/icon.svg"`
- **Absolute URL:** `"https://example.com/icon.png"`
- **Data URLs:** `"data:image/svg+xml;base64,..."`

Examples:
```json
{
  "name": "Service 1",
  "icon": "static/kima.png",
  "link": "http://localhost:8080"
},
{
  "name": "Service 2",
  "icon": "https://cdn.example.com/logo.svg",
  "link": "http://localhost:3000"
}
```

## Troubleshooting

Check iframe policies if a service fails to load. Some services may have restrictions that prevent them from being embedded in an iframe. You can modify CSP headers or use a proxy to bypass these restrictions. If you encounter issues, check the browser console for errors related to iframe loading or CSP violations.
