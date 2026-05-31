const http = require("http");
const Corrosion = require("corrosion");

const proxy = new Corrosion({
    prefix: "/service/",
    codec: "xor"
});

const PORT = process.env.PORT || 8080;

proxy.bundleScripts();

const server = http.createServer((req, res) => {
    if (req.url.startsWith(proxy.prefix)) {
        proxy.request(req, res);
        return;
    }

    res.end(`
        <!DOCTYPE html>
        <html>
        <body>
            <form action="/service/gateway/" method="POST">
                <input name="url" placeholder="https://example.com">
                <button>Go</button>
            </form>
        </body>
        </html>
    `);
});

server.on("upgrade", (req, socket, head) => {
    proxy.upgrade(req, socket, head);
});

server.listen(PORT, () => {
    console.log(`Running on port ${PORT}`);
});