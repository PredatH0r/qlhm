var config = {
    // Bind the server to either a socket or (optionally) some combination of port and hostname
    listen: {
        /* socket: "/path/to/your/socket" */
        hostname: "127.0.0.1"
      , port: 8080
    }

    // Client version updating
  , client: {
        // The current public release
        version: 0.3

        // The location where users can obtain the current public release
      , download_url: "https://github.com/supahgreg/qlhm/wiki/Version-History"
    }

    // userscripts.org things
  , uso: {
        // How long to wait after certain USO responses (in minutes)
        delay: {
            META_NOT_FOUND: 60
          , META_SERVER_ERROR: 5
          , SCRIPT_NOT_FOUND: 60
          , SCRIPT_SERVER_ERROR: 5
          , SCRIPT_IS_CURRENT: 30
          , SCRIPT_SUCCESS: 30
        }

        // How long to wait for USO to respond (in seconds)
      , timeoutSeconds: 10
    }
}

module.exports = config;
