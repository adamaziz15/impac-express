(function() {
  var mnoAppModules;

  mnoAppModules = ['ngRoute', 'ngSanitize', 'xeditable', 'ui.bootstrap', 'maestrano.assets', 'maestrano.utilities', 'maestrano.components', 'maestrano.message-bus'];

  this.maestranoApp = angular.module('maestrano', mnoAppModules);

  this.maestranoApp.config([
    '$httpProvider', '$sceDelegateProvider', function($httpProvider, $sceDelegateProvider) {
      var token;
      $httpProvider.defaults.headers.common['Accept'] = 'application/json';
      $httpProvider.defaults.headers.common['Content-Type'] = 'application/json';
      if (token = $("meta[name='csrf-token']").attr("content")) {
        $httpProvider.defaults.headers.common['X-CSRF-Token'] = token;
      }
      $sceDelegateProvider.resourceUrlWhitelist(['self']);
      return $httpProvider;
    }
  ]);

  this.maestranoApp.run([
    '$rootScope', 'AssetPath', 'TemplatePath', 'editableOptions', function($rootScope, AssetPath, TemplatePath, editableOptions) {
      $rootScope.assetPath = AssetPath;
      $rootScope.templatePath = TemplatePath;
      return editableOptions.theme = 'bs3';
    }
  ]);

}).call(this);
(function() {
  var maestranoComponents;

  maestranoComponents = angular.module('maestrano.components', ['maestrano.components.mno-flash-msg', 'maestrano.components.mno-notification-widget', 'maestrano.components.mno-loading-lounge', 'maestrano.components.mno-password-strength', 'maestrano.components.mno-compile', 'maestrano.components.mno-password']);

}).call(this);
(function() {
  var module;

  module = angular.module('maestrano.components.mno-compile', []);

  module.directive('compile', [
    '$compile', function($compile) {
      return function(scope, element, attrs) {
        return scope.$watch((function(scope) {
          return scope.$eval(attrs.compile);
        }), function(value) {
          element.html(value);
          return $compile(element.contents())(scope);
        });
      };
    }
  ]);

}).call(this);
(function() {
  var module;

  module = angular.module('maestrano.components.mno-flash-msg', []);

  module.controller('MnoFlashMsgCtrl', [
    '$scope', 'MsgBus', function($scope, MsgBus) {
      $scope.errors = MsgBus.subscribe('errors');
      $scope.isFlashShown = function() {
        return $scope.errors().length > 0;
      };
      return $scope.closeFlash = function() {
        return MsgBus.publish('errors', []);
      };
    }
  ]);

  module.directive('mnoFlashMsg', [
    'TemplatePath', function(TemplatePath) {
      return {
        restrict: 'A',
        scope: {},
        controller: 'MnoFlashMsgCtrl',
        template: '<div class="alert alert-error alert-top fade" ng-class="isFlashShown() && \'in\'"> <button class="close" ng-click="closeFlash()">&times;</button> <strong>Snap! This action couldn\'t be performed.</strong> <ul> <li ng-repeat="error in errors()"> {{error}} </li> </ul> </div>'
      };
    }
  ]);

}).call(this);
(function() {
  var module;

  module = angular.module('maestrano.components.mno-loading-lounge', ['maestrano.assets']);

  module.controller('MnoLoadingLoungeCtrl', [
    '$scope', '$http', 'AssetPath', 'Utilities', '$window', '$timeout', function($scope, $http, AssetPath, Utilities, $window, $timeout) {
      var appInstance, appInstanceId, currentStatus, reloadAppInstance;
      $scope.assetPath = AssetPath;
      $scope.appInstance = appInstance = $scope.mnoLoadingLounge();
      appInstanceId = $scope.mnoLoadingLounge().id;
      $scope.redirectionCounter = 5;
      $scope.scheduler = null;
      $scope.redirectScheduler = null;
      currentStatus = $scope.currentStatus = function() {
        var ref, ref1;
        if (appInstance.id) {
          if (appInstance.errors && appInstance.errors.length > 0) {
            return 'errors';
          } else if ((ref = appInstance.status) === 'terminating' || ref === 'terminated') {
            return 'terminated';
          } else if (appInstance.status === 'running' && appInstance.is_online) {
            return 'online';
          } else if ((ref1 = appInstance.status) === 'provisioning' || ref1 === 'staged') {
            return 'creating';
          } else if (appInstance.status === 'updating' || (appInstance.status === 'running' && !appInstance.is_online)) {
            return 'updating';
          } else {
            return 'loading';
          }
        } else {
          return 'not_found';
        }
      };
      $scope.errorMessages = function() {
        return Utilities.processRailsError(appInstance.errors);
      };
      $scope.isProgressBarShown = function() {
        return currentStatus() === 'creating' || currentStatus() === 'loading';
      };
      $scope.progressBarPercent = function() {
        var elapsedTime, endTime, maxDuration, percent, realStatus, referenceField, startTime;
        if (!$scope.isProgressBarShown()) {
          return 0;
        }
        realStatus = appInstance.status;
        if (realStatus === 'staged') {
          realStatus = 'provisioning';
        }
        if (realStatus === 'restarting') {
          realStatus = 'starting';
        }
        maxDuration = appInstance.durations[realStatus];
        if (realStatus === 'stopping') {
          maxDuration += appInstance.durations['starting'];
        }
        referenceField = {
          'provisioning': 'created_at',
          'starting': 'started_at',
          'stopping': 'stopped_at'
        }[realStatus];
        startTime = new Date(appInstance[referenceField]);
        endTime = new Date(appInstance.server_time);
        elapsedTime = (endTime.getTime() - startTime.getTime()) / 1000;
        if (maxDuration > 0) {
          percent = Math.round((elapsedTime / maxDuration) * 100);
          percent = Math.min(percent, 95);
          percent = Math.max(percent, 5);
        } else {
          percent = 95;
        }
        percent = percent + "%";
        return percent;
      };
      reloadAppInstance = function(_appInstance) {
        var q;
        q = $http.get($window.location.pathname);
        q.then(function(success) {
          return angular.copy(success.data, _appInstance);
        });
        return q;
      };
      $scope.startAutoRefresh = function() {
        var intervalMilliSec;
        intervalMilliSec = 5 * 1000;
        if ($scope.scheduler != null) {
          $timeout.cancel($scope.scheduler);
        }
        return $scope.scheduler = $timeout(function() {
          reloadAppInstance(appInstance);
          return $scope.startAutoRefresh();
        }, intervalMilliSec);
      };
      $scope.stopAutoRefresh = function() {
        if ($scope.scheduler != null) {
          return $timeout.cancel($scope.scheduler);
        }
      };
      $scope.redirectUrl = function() {
        return "/mnoe/launch/" + appInstance.uid;
      };
      $scope.performRedirection = function() {
        return window.location = $scope.redirectUrl();
      };
      $scope.startRedirectCountdown = function() {
        var intervalMilliSec;
        intervalMilliSec = 1 * 1000;
        if ($scope.redirectScheduler != null) {
          $timeout.cancel($scope.redirectScheduler);
        }
        return $scope.redirectScheduler = $timeout(function() {
          $scope.redirectionCounter -= 1;
          if ($scope.redirectionCounter > 0) {
            $scope.startRedirectCountdown();
          }
          if ($scope.redirectionCounter === 0) {
            return $scope.performRedirection();
          }
        }, intervalMilliSec);
      };
      $scope.stopRedirectCountdown = function() {
        if ($scope.redirectScheduler != null) {
          $timeout.cancel($scope.redirectScheduler);
          return $scope.redirectionCounter = 5;
        }
      };
      return $scope.$watch((function() {
        return currentStatus();
      }), function(status) {
        if (status === 'loading' || status === 'creating' || status === 'updating') {
          if (!$scope.scheduler) {
            $scope.startAutoRefresh();
          }
        } else {
          if ($scope.scheduler) {
            $scope.stopAutoRefresh();
          }
        }
        if (status === 'online') {
          if (!$scope.redirectScheduler) {
            return $scope.startRedirectCountdown();
          }
        } else {
          if ($scope.redirectScheduler) {
            return $scope.stopRedirectCountdown();
          }
        }
      });
    }
  ]);

  module.directive('mnoLoadingLounge', [
    'TemplatePath', function(TemplatePath) {
      return {
        restrict: 'AE',
        scope: {
          mnoLoadingLounge: '&'
        },
        templateUrl: TemplatePath['mno_enterprise/maestrano-components/loading_lounge.html'],
        controller: 'MnoLoadingLoungeCtrl'
      };
    }
  ]);

}).call(this);
(function() {
  var module;

  module = angular.module('maestrano.components.mno-notification-widget', ['maestrano.assets']);

  module.controller('MnoNotificationWidgetCtrl', [
    '$scope', '$rootScope', 'Utilities', 'MsgBus', '$timeout', '$window', '$modal', '$sce', function($scope, $rootScope, Utilities, MsgBus, $timeout, $window, $modal, $sce) {
      var notifPopup, notifWidget;
      $scope.assetPath = $rootScope.assetPath;
      $scope.windowHeight = $window.innerHeight;
      $scope.notifWidget = notifWidget = {};
      $scope.notifPopup = notifPopup = {};
      notifWidget.inboundQueue = MsgBus.subscribe('notificationQueue');
      notifWidget.outboundQueue = [];
      notifWidget.popupQueue = [];
      notifWidget.jqAlertElem = function(msgIndex) {
        return $(".notification-widget #notification" + msgIndex);
      };
      notifWidget.classFor = function(messageObject) {
        return "alert alert-" + messageObject.type;
      };
      notifWidget.pushMsg = function(messageObject) {
        var msgIndex, realMsgObj, self;
        self = this;
        if (angular.isObject(messageObject) || (angular.isString(messageObject) && messageObject !== '')) {
          if (angular.isObject(messageObject)) {
            if (messageObject.msg && messageObject.msg !== '') {
              realMsgObj = {
                type: messageObject.type || 'info',
                msg: $sce.trustAsHtml(messageObject.msg),
                timeout: messageObject.timeout || 10 * 60 * 1000,
                popup: messageObject.popup || false
              };
            }
          } else if (angular.isString(messageObject)) {
            realMsgObj = {
              type: 'info',
              msg: $sce.trustAsHtml(messageObject),
              timeout: 10 * 60 * 1000,
              popup: false
            };
          }
          if (realMsgObj) {
            msgIndex = self.outboundQueue.push(realMsgObj) - 1;
            if (realMsgObj.popup) {
              self.popupQueue.push(realMsgObj);
            }
            $timeout(function() {
              return self.jqAlertElem(msgIndex).animate({
                'right': '0px'
              }, 500);
            }, 400);
            if (angular.isNumber(realMsgObj.timeout) && realMsgObj.timeout > 0) {
              return $timeout(function() {
                return self.closeMsg(realMsgObj);
              }, realMsgObj.timeout);
            }
          }
        }
      };
      notifWidget.closeMsg = function(messageObject) {
        var msgIndex, self;
        self = this;
        msgIndex = self.outboundQueue.indexOf(messageObject);
        if (msgIndex >= 0) {
          self.jqAlertElem(msgIndex).animate({
            'right': '-300px'
          }, 500, function() {
            self.outboundQueue.splice(msgIndex, 1);
            return $scope.$apply();
          });
        }
        return true;
      };
      notifPopup.open = function() {
        var self;
        self = this;
        self.$instance = $modal.open({
          templateUrl: 'internal-notif-popup-modal.html',
          scope: $scope
        });
        self.isOpen = true;
        self.msgObject = notifWidget.popupQueue[0];
        self.model = {};
        if (angular.isObject(self.msgObject.popup)) {
          self.model.title = self.msgObject.popup.title || 'Notification';
          self.model.content = self.msgObject.popup.content || self.msgObject.msg;
          return self.model.dismissText = self.msgObject.popup.dismissText || 'Dismiss';
        } else {
          self.model.title = 'Notification';
          self.model.content = self.msgObject.msg;
          return self.model.dismissText = 'Dismiss';
        }
      };
      notifPopup.close = function() {
        var self;
        self = this;
        self.$instance.close();
        self.isOpen = false;
        self.msgObject = void 0;
        self.model = {};
        return notifWidget.popupQueue.shift();
      };
      if (angular.isArray($scope.mnoNotificationWidget()) && $scope.mnoNotificationWidget().length > 0) {
        _.each($scope.mnoNotificationWidget(), function(msgObject) {
          return notifWidget.pushMsg(msgObject);
        });
      }
      $timeout(function() {
        return $scope.$watch(function() {
          if (notifWidget.inboundQueue().length > 0) {
            return notifWidget.pushMsg(notifWidget.inboundQueue().shift());
          }
        }, (function() {}));
      }, 1500);
      return $scope.$watch(function() {
        if (!notifPopup.isOpen && notifWidget.popupQueue.length > 0) {
          return notifPopup.open();
        }
      }, (function() {}));
    }
  ]);

  module.directive('mnoNotificationWidget', [
    'TemplatePath', function(TemplatePath) {
      return {
        restrict: 'A',
        scope: {
          mnoNotificationWidget: '&',
          userLoggedIn: '&'
        },
        templateUrl: TemplatePath['mno_enterprise/maestrano-components/notification-widget.html'],
        controller: 'MnoNotificationWidgetCtrl'
      };
    }
  ]);

}).call(this);
(function() {
  "use strict";
  angular.module("maestrano.components.mno-password-strength", []).directive("mnoPasswordStrength", function() {
    return {
      require: "ngModel",
      restrict: "A",
      scope: {
        passwordScore: '='
      },
      link: function(scope, elem, attrs, ctrl) {
        var getClass, getPwStrength, isPwStrong, mesureStrength;
        mesureStrength = function(p) {
          var back, counts, forth, i, letters, matches, numbers, p2, strength, symbols, tmp;
          matches = {
            pos: {},
            neg: {}
          };
          counts = {
            pos: {},
            neg: {
              seqLetter: 0,
              seqNumber: 0,
              seqSymbol: 0
            }
          };
          tmp = void 0;
          strength = 0;
          letters = "abcdefghijklmnopqrstuvwxyz";
          numbers = "01234567890";
          symbols = "\\!@#$%&/()=?¿";
          back = void 0;
          forth = void 0;
          i = void 0;
          if (p) {
            matches.pos.lower = p.match(/[a-z]/g);
            matches.pos.upper = p.match(/[A-Z]/g);
            matches.pos.numbers = p.match(/\d/g);
            matches.pos.symbols = p.match(/[$-\/:-?{-~!^_`\[\]]/g);
            matches.pos.middleNumber = p.slice(1, -1).match(/\d/g);
            matches.pos.middleSymbol = p.slice(1, -1).match(/[$-\/:-?{-~!^_`\[\]]/g);
            counts.pos.lower = (matches.pos.lower ? matches.pos.lower.length : 0);
            counts.pos.upper = (matches.pos.upper ? matches.pos.upper.length : 0);
            counts.pos.numbers = (matches.pos.numbers ? matches.pos.numbers.length : 0);
            counts.pos.symbols = (matches.pos.symbols ? matches.pos.symbols.length : 0);
            tmp = _.reduce(counts.pos, function(memo, val) {
              return memo + Math.min(1, val);
            }, 0);
            counts.pos.numChars = p.length;
            tmp += (counts.pos.numChars >= 8 ? 1 : 0);
            counts.pos.requirements = (tmp >= 3 ? tmp : 0);
            counts.pos.middleNumber = (matches.pos.middleNumber ? matches.pos.middleNumber.length : 0);
            counts.pos.middleSymbol = (matches.pos.middleSymbol ? matches.pos.middleSymbol.length : 0);
            matches.neg.consecLower = p.match(/(?=([a-z]{2}))/g);
            matches.neg.consecUpper = p.match(/(?=([A-Z]{2}))/g);
            matches.neg.consecNumbers = p.match(/(?=(\d{2}))/g);
            matches.neg.onlyNumbers = p.match(/^[0-9]*$/g);
            matches.neg.onlyLetters = p.match(/^([a-z]|[A-Z])*$/g);
            counts.neg.consecLower = (matches.neg.consecLower ? matches.neg.consecLower.length : 0);
            counts.neg.consecUpper = (matches.neg.consecUpper ? matches.neg.consecUpper.length : 0);
            counts.neg.consecNumbers = (matches.neg.consecNumbers ? matches.neg.consecNumbers.length : 0);
            i = 0;
            while (i < letters.length - 2) {
              p2 = p.toLowerCase();
              forth = letters.substring(i, parseInt(i + 3));
              back = _(forth).split("").reverse();
              if (p2.indexOf(forth) !== -1 || p2.indexOf(back) !== -1) {
                counts.neg.seqLetter++;
              }
              i++;
            }
            i = 0;
            while (i < numbers.length - 2) {
              forth = numbers.substring(i, parseInt(i + 3));
              back = _(forth).split("").reverse();
              if (p.indexOf(forth) !== -1 || p.toLowerCase().indexOf(back) !== -1) {
                counts.neg.seqNumber++;
              }
              i++;
            }
            i = 0;
            while (i < symbols.length - 2) {
              forth = symbols.substring(i, parseInt(i + 3));
              back = _(forth).split("").reverse();
              if (p.indexOf(forth) !== -1 || p.toLowerCase().indexOf(back) !== -1) {
                counts.neg.seqSymbol++;
              }
              i++;
            }
            counts.neg.repeated = _.chain(p.toLowerCase().split("")).countBy(function(val) {
              return val;
            }).reject(function(val) {
              return val === 1;
            }).reduce(function(memo, val) {
              return memo + val;
            }, 0).value();
            strength += counts.pos.numChars * 4;
            if (counts.pos.upper) {
              strength += (counts.pos.numChars - counts.pos.upper) * 2;
            }
            if (counts.pos.lower) {
              strength += (counts.pos.numChars - counts.pos.lower) * 2;
            }
            if (counts.pos.upper || counts.pos.lower) {
              strength += counts.pos.numbers * 4;
            }
            strength += counts.pos.symbols * 6;
            strength += (counts.pos.middleSymbol + counts.pos.middleNumber) * 2;
            strength += counts.pos.requirements * 2;
            strength -= counts.neg.consecLower * 2;
            strength -= counts.neg.consecUpper * 2;
            strength -= counts.neg.consecNumbers * 2;
            strength -= counts.neg.seqNumber * 3;
            strength -= counts.neg.seqLetter * 3;
            strength -= counts.neg.seqSymbol * 3;
            if (matches.neg.onlyNumbers) {
              strength -= counts.pos.numChars;
            }
            if (matches.neg.onlyLetters) {
              strength -= counts.pos.numChars;
            }
            if (counts.neg.repeated) {
              strength -= (counts.neg.repeated / counts.pos.numChars) * 10;
            }
          }
          return Math.max(0, Math.min(100, Math.round(strength)));
        };
        getPwStrength = function(s) {
          switch (Math.round(s / 20)) {
            case 0:
            case 1:
              return "weak";
            case 2:
            case 3:
              return "good";
            case 4:
            case 5:
              return "secure";
          }
        };
        getClass = function(s) {
          switch (getPwStrength(s)) {
            case 'weak':
              return "danger";
            case 'good':
              return "warning";
            case 'secure':
              return "success";
          }
        };
        isPwStrong = function(s) {
          switch (getPwStrength(s)) {
            case 'weak':
              return false;
            default:
              return true;
          }
        };
        scope.$watch((function() {
          return ctrl.$modelValue;
        }), function() {
          scope.value = mesureStrength(ctrl.$modelValue);
          scope.pwStrength = getPwStrength(scope.value);
          ctrl.$setValidity('password-strength', isPwStrong(scope.value));
          if (scope.passwordScore != null) {
            scope.passwordScore.value = scope.pwStrength;
            scope.passwordScore["class"] = getClass(scope.value);
            return scope.passwordScore.showTip = (ctrl.$modelValue != null) && ctrl.$modelValue !== '' && !isPwStrong(scope.value);
          }
        });
      }
    };
  });

}).call(this);
(function() {
  var module;

  module = angular.module('maestrano.components.mno-password', ['maestrano.assets']);

  module.directive('mnoPassword', [
    'TemplatePath', function(TemplatePath) {
      return {
        restrict: 'AE',
        scope: {
          baseObject: '=mnoPassword',
          form: '='
        },
        templateUrl: TemplatePath['mno_enterprise/maestrano-components/password.html'],
        link: function(scope, element, attrs) {
          scope.isShown = false;
          scope.hasEightChars = false;
          scope.hasOneNumber = false;
          scope.hasOneUpper = false;
          scope.hasOneLower = false;
          scope.fieldName = attrs.mnoPassword + "[password]";
          return scope.check = function() {
            scope.hasEightChars = (scope.baseObject.password != null) && (scope.baseObject.password.length >= 8);
            scope.hasOneNumber = false;
            scope.hasOneUpper = false;
            scope.hasOneLower = false;
            if (angular.isString(scope.baseObject.password)) {
              angular.forEach(scope.baseObject.password.split(""), function(letter) {
                if (parseInt(letter)) {
                  scope.hasOneNumber = true;
                }
                if (letter === letter.toUpperCase() && letter !== letter.toLowerCase() && !parseInt(letter)) {
                  scope.hasOneUpper = true;
                }
                if (letter === letter.toLowerCase() && letter !== letter.toUpperCase() && !parseInt(letter)) {
                  return scope.hasOneLower = true;
                }
              });
              if (scope.hasEightChars && scope.hasOneNumber && scope.hasOneUpper && scope.hasOneLower) {
                return scope.form[scope.fieldName].$setValidity("password", true);
              } else {
                return scope.form[scope.fieldName].$setValidity("password", false);
              }
            }
          };
        }
      };
    }
  ]);

}).call(this);
(function() {
  var maestranoAssets;

  maestranoAssets = angular.module('maestrano.assets', []);

  maestranoAssets.factory('AssetPath', function() {
    return {
      "mno_enterprise/main-logo.png": "/assets/mno_enterprise/main-logo-5c48b2b6641dafda1469166314f9a96774129f7e4b93b193fd8143fafe84ab10.png",
      "favicon.ico": "/assets/favicon-ea949ab4c7391882d6edb09306f14a32824e5b53305a7db2bd93d42636e0a913.ico",
      "mno_enterprise/loader-32x32-bg-inverse.gif": "/assets/mno_enterprise/loader-32x32-bg-inverse-bbc5cc7c7baabb43292f7e15e02309a25446326cff0876e3e1396610d0d6f54f.gif",
      "mno_enterprise/loader-32x32-bg-main.gif": "/assets/mno_enterprise/loader-32x32-bg-main-7174c00ae6672c88b1eb988bfb8fbd0d23809719476da75841648221640caa96.gif",
      "mno_enterprise/maestrano/logo-whitebg.png": "/assets/mno_enterprise/maestrano/logo-whitebg-4cf40268c06858f2e230bd00613b1aedad5ffca48696e383239cd4e8c9f9eff5.png"
    };
  });

  maestranoAssets.factory('TemplatePath', function() {
    return {
      "mno_enterprise/maestrano-components/loading_lounge.html": "/assets/mno_enterprise/maestrano-components/loading_lounge-7de8e39980f2d96d974c1ee8042dc937f425e27426e49c52040bb3e6d6a2e6df.html",
      "mno_enterprise/maestrano-components/notification-widget.html": "/assets/mno_enterprise/maestrano-components/notification-widget-112f48cdd45609d1400f8bbeb918c475b5b01385ab641f357bd8312aa9b69322.html",
      "mno_enterprise/maestrano-components/password.html": "/assets/mno_enterprise/maestrano-components/password-89df20b54a5f2fe93046ce92c29d13391388ef27dc039c422adceab9c2b1e218.html"
    };
  });

}).call(this);
(function() {
  angular.module('maestrano.services.message-svc', []).factory('MessageSvc', [
    '$q', '$rootScope', 'TemplatePath', function($q, $rootScope, TemplatePath) {
      var bootstrap, bootstraped, currentMessage, openExternalModal, service, templateMessageUrl;
      service = {};
      service.messages = [];
      service.count = 0;
      bootstraped = false;
      currentMessage = null;
      service.putMessage = function(message) {
        service.messages.push(message);
        if (!bootstraped) {
          return bootstrap();
        }
      };
      service.pullMessage = function() {
        currentMessage['templateUrl'] = templateMessageUrl();
        return currentMessage;
      };
      service.next = function() {
        if (service.messages.length > 0) {
          currentMessage = service.messages.splice(0, 1)[0];
          if (currentMessage.type === 'external-modal') {
            return openExternalModal();
          } else {
            return service.count += 1;
          }
        } else {
          currentMessage = null;
          bootstraped = false;
          return service.count = 0;
        }
      };
      bootstrap = function() {
        bootstraped = true;
        return service.next();
      };
      openExternalModal = function() {
        var msgbus, unregister;
        msgbus = currentMessage.msgbus;
        msgbus().value = true;
        return unregister = $rootScope.$watch((function() {
          return msgbus().value;
        }), function() {
          if (msgbus().value === false) {
            unregister();
            return service.next();
          }
        });
      };
      templateMessageUrl = function() {
        switch (currentMessage.category) {
          case 'taskCompleted':
            return TemplatePath['mno_enterprise/maestrano-components/modal-messages/congratulations.html'];
          case 'information':
            return TemplatePath['mno_enterprise/maestrano-components/modal-messages/information.html'];
          case 'default':
            return TemplatePath['mno_enterprise/maestrano-components/modal-messages/default.html'];
          default:
            return TemplatePath['mno_enterprise/maestrano-components/modal-messages/default.html'];
        }
      };
      return service;
    }
  ]);

}).call(this);
(function() {
  angular.module('maestrano.message-bus', []).factory('MsgBus', [
    function() {
      var msgBus, msgBusData;
      msgBus = {};
      msgBusData = {
        dashboardGrid: {},
        controlBarFilter: {},
        controlBarQuickFilter: {},
        orgaSharingModal: {},
        appConnectModal: {},
        page: {},
        pane: {},
        errors: [],
        autostopQueue: [],
        notificationQueue: [],
        params: {}
      };
      msgBus.publish = function(name, object) {
        return msgBusData[name] = object;
      };
      msgBus.subscribe = function(name) {
        return function() {
          return msgBusData[name];
        };
      };
      return msgBus;
    }
  ]);

}).call(this);
(function() {
  angular.module('maestrano.utilities', []).factory('Utilities', [
    function() {
      var service;
      service = {};
      service.processRailsError = function(error) {
        var messages;
        messages = [];
        if (error.status && error.status === 401) {
          messages.push("Sorry! You are not authorized to perform this action");
        } else {
          if (error.data && error.data !== " ") {
            if (angular.isArray(error.data)) {
              _.each(error.data, function(errorMessage) {
                var capitalizedError;
                capitalizedError = errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1);
                return messages.push("" + capitalizedError);
              });
            } else if (angular.isObject(error.data)) {
              _.each(error.data, function(attrErrors, attribute) {
                var capitalizedAttr;
                capitalizedAttr = attribute.charAt(0).toUpperCase() + attribute.slice(1);
                if (angular.isArray(attrErrors)) {
                  return _.each(attrErrors, function(attrError) {
                    if (capitalizedAttr.match(/base/i)) {
                      return messages.push(attrError);
                    } else {
                      return messages.push(capitalizedAttr + " " + attrError);
                    }
                  });
                } else {
                  if (capitalizedAttr.match(/base/i)) {
                    return messages.push(attrErrors);
                  } else {
                    return messages.push(capitalizedAttr + " " + attrErrors);
                  }
                }
              });
            } else if (angular.isString(error.data)) {
              messages.push(error.data);
            } else {
              messages.push("Potentially a system or communication error. Please retry later.");
            }
          } else {
            messages.push("Potentially a system or communication error. Please retry later.");
          }
        }
        return messages;
      };
      service.camelize = function(word) {
        return word.replace(/(?:^|[-_])(\w)/g, function(_, c) {
          if (c) {
            return c.toUpperCase();
          } else {
            return '';
          }
        });
      };
      service.jsCamelize = function(word) {
        var camelized;
        camelized = this.camelize(word);
        return camelized.charAt(0).toLowerCase() + camelized.slice(1);
      };
      service.capitalize = function(word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      };
      return service;
    }
  ]);

}).call(this);
// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/sstephenson/sprockets#sprockets-directives) for details
// about supported directives.
//
// require mno_enterprise/twitter/bootstrap


;
