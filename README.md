# Impac Express

## Getting started

Update `config/settings/development.yml` and `config/application.yml` with the configuration you've been provided with.

```
$ bundle
$ foreman start
```

Open http://localhost:7000/ in your browser

If you work on frontend customisations, you need to start `gulp` for live reload:

```
$ foreman start -f Procfile.dev
```

Open http://localhost:7001/ in your browser


## Upgrading

```
# Update mno-enterprise
bundle update mno-enterprise

# Upgrade and rebuild the frontend
rm -rf tmp/build tmp/cache
bin/rake mnoe:admin:dist
bin/rake mnoe:frontend:update
```

