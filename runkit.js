const tt = require("tar-transform");
const fetch = require("node-fetch");

const routes = {
  /** no-op */
  "original-file": () =>
    tt.transform({
      onEntry(entry) {
        this.push(entry);
      },
    }),
  /** Transform path for each entry: prefix with my-root/ */
  "transform-entry-path": () =>
    tt.transform({
      onEntry(entry) {
        const headers = this.util.headersWithNewName(
          entry.headers,
          "my-root/" + entry.headers.name,
        );

        this.push({ ...entry, headers });
      },
    }),

  /** edit file content: prefix *.txt files */
  "edit-file-content": () =>
    tt.transform({
      async onEntry(entry) {
        if (entry.headers.name.endsWith(".txt")) {
          const oldContent = await this.util.stringContentOfTarEntry(entry);
          const newContent = "HACKED BY tar-transform\n" + oldContent;
          this.push({
            headers: entry.headers,
            content: newContent,
          });
        } else {
          this.push(entry);
        }
      },
    }),

  /** remove files from tarball: remove *.png files */
  "remove-file": () =>
    tt.transform({
      onEntry(entry) {
        if (entry.headers.name.endsWith(".png")) {
          this.pass(entry);
        } else {
          this.push(entry);
        }
      },
    }),

  /**
   * add files to tarball:
   * add a file including the directory structure using context
   */
  "add-file": () =>
    tt.transform({
      initCtx: [],
      onEntry(entry) {
        this.ctx.push([entry.headers.name, entry.headers.type]);
        this.push(entry);
      },
      onEnd() {
        this.push({
          headers: { name: "file-structure.txt" },
          content: this.ctx
            .map(([name, type]) => `[${type}]\t${name}`)
            .join("\n"),
        });
      },
    }),
};

exports.endpoint = async (req, resp) => {
  const { pathname } = require("url").parse(req.url);

  const getTransformStream = routes[pathname.slice(1)];
  if (!getTransformStream) {
    resp.end("invalid request url: " + resp.url);
    return;
  }

  const tgzStream = (
    await fetch(
      "https://runkit.io/equalma/tar-transform-pack/branches/master/tgz",
    )
  ).body;

  const extractStream = tt.extract();

  const transformStream = getTransformStream();

  const packStream = tt.pack({ gzip: true });

  resp.setHeader("Content-Type", "application/octet-stream");
  resp.setHeader(
    "Content-Disposition",
    `attachment; filename="tar-transform-demo-${pathname.slice(1)}.tgz"`,
  );

  tgzStream
    .pipe(extractStream)
    .pipe(transformStream)
    .pipe(packStream)
    .pipe(resp)
    .on("error", console.error);
};

const urlRoot = process.env.RUNKIT_ENDPOINT_URL;
const html = Object.keys(routes)
  .map(route => {
    const url = urlRoot + "/" + route;
    return `
<form method="get" action="${url}">
    <button type="submit">${route}</button>
    <input readonly value="${url}">
</form>
`;
  })
  .join("\n");

html;
