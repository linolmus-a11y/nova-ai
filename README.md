# NOVA 5.2
Local AI + Ollama + LAN access.

Ollama remains a separate Windows application.
Models stay wherever Ollama is configured (for you: E:\Ollama\models).

Start:
cd E:\nova5.2\nova_build
npm.cmd install
npm.cmd start

NOVA expects Ollama at http://127.0.0.1:11434.
Do not expose Ollama port 11434 to the Internet.
For phone access, use the PC LAN address on port 3000.
