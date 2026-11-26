
{
  "manifest_version": 3,
  "name": "VECTOR - AI Browser Assistant",
  "version": "1.1.0",
  "description": "Your personal AI browser assistant powered by Qwen.",
  "permissions": [
    "tabs",
    "storage",
    "scripting",
    "activeTab",
    "sidePanel"
  ],
  "host_permissions": [
    "https://*/*",
    "http://*/*",
    "http://localhost:11434/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_title": "Open VECTOR"
  },
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "content_scripts": [
    {
      "matches": [
        "https://*/*",
        "http://*/*"
      ],
      "js": [
        "content.js"
      ],
      "run_at": "document_idle"
    }
  ]
}
