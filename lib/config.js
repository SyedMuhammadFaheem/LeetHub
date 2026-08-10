// Register a GitHub OAuth App at https://github.com/settings/developers,
// enable "Enable Device Flow" in its settings, then paste the Client ID below.
// No client secret is needed or stored — device flow is safe for a pure
// client-side extension.
var GITHUB_CLIENT_ID = "Ov23liwA2oWWZ0C6FCJH";

if (typeof module !== "undefined") {
  module.exports = { GITHUB_CLIENT_ID };
}
