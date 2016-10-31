(function() {
  angular.module('mnoEnterprise.configuration', []).constant('IMPAC_CONFIG', {
    "paths": {
      "mnohub_api": "/mnoe/jpi/v1"
    },
    "protocol": "http",
    "host": "localhost:4000"
  }).constant('I18N_CONFIG', {
    enabled: false,
    available_locales: ["en", "id", "zh"]
  }).constant('PRICING_CONFIG', {
    "enabled": false
  }).constant('DOCK_CONFIG', {
    "enabled": true
  }).constant('GOOGLE_TAG_CONTAINER_ID', "GTM-TH3MLB").constant('INTERCOM_ID', null).constant('APP_NAME', "Impac Developers");

}).call(this);
