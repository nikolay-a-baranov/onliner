export const runner = {
  files({ files, manifest, load, toolUrl }) {
    return manifest()
      .then((value) =>
        files.reduce(
          (chain, file) => chain.then(() => load(toolUrl(file, value))),
          Promise.resolve(),
        ),
      )
      .catch(() => {});
  },
  run({ id, tools, manifest, load, toolUrl }) {
    const tool = tools.find((item) => item.id === id);
    if (!tool) return;
    return runner.files({
      files: [tool.file],
      manifest,
      load,
      toolUrl,
    });
  },
};
