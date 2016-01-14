
// --- Primstav Configuration
config_def = {
  tasksURL: "data/tasks.json",
  holidaysURL: "data/holidays.json",
  awayURL: "data/away.json",
  minDate: "2015-12-28",
  maxDate: "2016-12-31",
  data: {
    colors: {
      holidays: '#f99',
      // away: '#59f',
      away: '#777',
      'Q+': '#00b',
      'Q+ WM': '#559',
      'AppInsight': '#0b0'
    },
    dateFormat: "%Y-%m-%d",
  },
  timeline: {
    dateFormat: "%d.%m.",
    tickCount: 24
  },
  tooltip: {
    dateFormat: "%d %b %Y"
  },
  holidays: {
    point: {
      r: 2,
      showRatio: 16,
      hideRatio: 14
    },
    value: 0.25
  },
  away: {
    point: {
      r: 2
    },
    value: 0.5
  }
}

var app = angular.module('pconfig', []);

app.controller('configFormCtrl', function($scope) {
  $scope.userconfigstr = Cookies.get('primstav.config');
  if ($scope.userconfigstr == undefined) {
    $scope.userconfigstr = JSON.stringify(config_def, null, 2);
    Cookies.set('primstav.config', $scope.userconfigstr);
  }
  $scope.browserConfig = JSON.parse($scope.userconfigstr);

  $scope.saveConfig = function() {
    $scope.browserConfig = JSON.parse($scope.userconfigstr);
    Cookies.set('primstav.config', $scope.userconfigstr);
    $('#confWindow').modal('hide');
  }
});
