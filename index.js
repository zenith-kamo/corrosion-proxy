const http = require("http");
const fs = require("fs");
const path = require("path");
const Corrosion = require("corrosion");

// 1. プロキシの構成を強化
const proxy = new Corrosion({
    prefix: "/service/",
    codec: "xor",
    forceURL: true,       // すべてのURL指定を強制的にプロキシ経由に書き換える
    followRedirects: true // リダイレクトを自動で追跡する
});

const PORT = process.env.PORT || 8080;

proxy.bundleScripts();

const server = http.createServer((req, res) => {
    // プロキシの処理
    if (req.url.startsWith(proxy.prefix)) {
        
        // 【修正ポイント】res.writeHead を乗っ取って、CORS/CSPヘッダーを強制注入・削除する
        const originalWriteHead = res.writeHead;
        res.writeHead = function (statusCode, headers) {
            headers = headers || {};
            
            // 既存のセキュリティヘッダーを大文字小文字問わず削除
            Object.keys(headers).forEach(key => {
                const lowerKey = key.toLowerCase();
                if (lowerKey === 'content-security-policy' || 
                    lowerKey === 'content-security-policy-report-only' || 
                    lowerKey === 'x-frame-options') {
                    delete headers[key];
                }
            });

            // CORS（クロスドメイン制限）を全許可にするヘッダーを追加
            headers["Access-Control-Allow-Origin"] = "*";
            headers["Access-Control-Allow-Headers"] = "*";
            headers["Access-Control-Allow-Methods"] = "*";

            return originalWriteHead.call(this, statusCode, headers);
        };

        // プロキシを実行
        proxy.request(req, res);
        return;
    }

    // index.html の読み込み
    const indexPath = path.join(__dirname, "index.html");
    
    fs.readFile(indexPath, (err, data) => {
        if (err) {
            res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("500 Internal Server Error: index.html が見つからないか、読み込めません。");
            return;
        }
        
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(data);
    });
});

server.on("upgrade", (req, socket, head) => {
    proxy.upgrade(req, socket, head);
});

server.listen(PORT, () => {
    console.log(`Running on port ${PORT}`);
});