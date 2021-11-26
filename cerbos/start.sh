docker run -i -t -p 3592:3592 \
  -v $(pwd)/config:/config \
  -v $(pwd)/policies:/policies \
  dbuduev/cerbos:0.10.0-prerelease \
  server --config=/config/conf.yaml
