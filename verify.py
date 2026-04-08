import asyncio
from playwright.async_api import async_playwright
import http.server
import socketserver
import threading
import os
import time

PORT = 8080
DIRECTORY = "sin 七大罪～魔王崇拜～"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

async def main():
    # Start the local server in a separate thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Give server a moment to start
    time.sleep(2)

    # Ensure the verification directory exists
    os.makedirs("/home/jules/verification", exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=["--use-gl=swiftshader", "--enable-webgl", "--disable-gpu", "--no-sandbox"]
        )

        # Start recording video
        context = await browser.new_context(
            record_video_dir="/home/jules/verification/",
            record_video_size={"width": 1024, "height": 768}
        )

        page = await context.new_page()

        # Listen to console logs
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
        page.on("pageerror", lambda msg: print(f"BROWSER ERROR: {msg}"))

        print("Navigating to local server...")
        await page.goto(f"http://localhost:{PORT}/index.html", wait_until="networkidle")

        # Give it some time to load the model
        print("Waiting for model to load...")
        await page.wait_for_timeout(5000)

        # Perform some interactions (mouse move)
        print("Simulating interactions...")
        await page.mouse.move(100, 100)
        await page.wait_for_timeout(500)
        await page.mouse.move(500, 500)
        await page.wait_for_timeout(500)
        await page.mouse.move(800, 200)
        await page.wait_for_timeout(500)

        # Click the center of the screen
        print("Clicking...")
        await page.mouse.click(512, 384)
        await page.wait_for_timeout(2000)

        # Take a screenshot
        screenshot_path = "/home/jules/verification/poc_screenshot.png"
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        # Close browser to finalize video recording
        await context.close()
        await browser.close()
        print("Browser closed.")

if __name__ == "__main__":
    asyncio.run(main())
