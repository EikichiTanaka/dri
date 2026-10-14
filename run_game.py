"""
run_game.py - 頭文字D ARCADE STAGE ランチャー
空いているポートを自動探索してローカルHTTPサーバーを起動し、
デフォルトのブラウザでゲームを即座に開きます。
"""

import http.server
import socketserver
import webbrowser
import os
import sys

def find_available_port(start_port=8000, max_tries=20):
    for port in range(start_port, start_port + max_tries):
        try:
            with socketserver.TCPServer(("", port), None) as s:
                return port
        except OSError:
            continue
    return start_port

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    port = find_available_port(8000)

    url = f"http://localhost:{port}/index.html"
    print("=" * 60)
    print("  INITIAL D ARCADE STAGE - AKINA DOWNHILL")
    print("  頭文字D アーケード 峠ドリフトレースゲーム")
    print("=" * 60)
    print(f"\n[OK] ローカルサーバーを起動しました: {url}")
    print("[OK] ブラウザを開いています...")
    print("\n※ ゲームを終了する場合は、このウィンドウを閉じるか Ctrl+C を押してください。\n")

    # ブラウザを自動で開く
    webbrowser.open(url)

    Handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", port), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nゲームを終了しました。")

if __name__ == "__main__":
    main()
