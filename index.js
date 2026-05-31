const http = require("http");
const fs = require("fs");
const path = require("path");
const Corrosion = require("corrosion");

const proxy = new Corrosion({
    prefix: "/service/",
    codec: "xor"
});

const PORT = process.env.PORT || 8080;

proxy.bundleScripts();

const server = http.createServer((req, res) => {
    // プロキシの処理
    if (req.url.startsWith(proxy.prefix)) {
        proxy.request(req, res);
        return;
    }

    // index.html の読み込み
    const indexPath = path.join(__dirname, "index.html");
    
    fs.readFile(indexPath, (err, data) => {
        if (err) {
            // ファイルの読み込みに失敗した場合のエラーハンドリング
            res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("500 Internal Server Error: index.html が見つからないか、読み込めません。");
            return;
        }
        
        // 正常に読み込めたらHTMLを返す
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