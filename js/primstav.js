//
// Primstav Task Calendar
// Copyright (c) 2016 Roozbeh Farahbod
//

// --- Primstav Configuration
var config_def = {
  holidayValue: 0,
  minDate: "2016-01-01",
  maxDate: "2016-12-31",
  data: {
    colors: {
      holidays: '#f99',
      'Q+': '#00b',
      'Q+ WM': '#55a',
      'AppInsight': '#0b0',
    },
    dateFormat: "%Y-%m-%d",
  },
  timeline: {
    dateFormat: "%d.%m",
    tickCount: 24
  },
  tooltip: {
    dateFormat: "%d %b %Y"
  }
}

// --- Load custome configuration
var config = (JSON.parse(JSON.stringify(config_def)));
if (typeof primstavconfig !== 'undefined') {
  config = $.extend(true, {}, config, primstavconfig);
}

// --- Variables and Constants
const MILLIS_IN_A_DAY = 24 * 3600 * 1000;

var dateFormat = d3.time.format(config.data.dateFormat);
var tooltipDateFormat = d3.time.format(config.tooltip.dateFormat);
var tickDateFormat = d3.time.format(config.timeline.dateFormat);

// --- get project names
var projectSet = {};
for (var i in tasks) {
  projectSet[tasks[i].project] = true;
}
var projects = [];
for (var p in projectSet) {
  projects.push(p);
}

// --- combine weekends and holidays
var offdays = {};

// add public holidays
for (var i in publicHolidays) {
  offdays[publicHolidays[i]] = true;
}

// --- Add Weekends
var offday = new Date(config.minDate);
var isWeekend = false;
do {
  dow = offday.getDay();
  if (dow == 6) {
    break;
  }
  if (dow == 0) {
    offday.setDate(offday.getDate() - 1);
    break;
  }
  offday.setDate(offday.getDate() + 1);
} while (true);

do {
  offdays[dateFormat(offday)] = true;
  offday.setDate(offday.getDate() + 1);
  offdays[dateFormat(offday)] = true;
  offday.setDate(offday.getDate() + 6);
} while (offday.getFullYear() == 2016);

// create column data
var holidays_x = ["holidays_x"];
for (var prop in offdays) {
  holidays_x.push(new Date(prop));
}
var holidays = ["holidays"];
for (var i in holidays_x) {
  if (i > 0) {
    holidays[i] = config.holidayValue;
  }
}

var colData = [];
var xMap = {};
var dataSeries = {};

for (var i in projects) {
  var pname = projects[i];
  xMap[pname] = pname + "_x";
}

xMap["holidays"] = "holidays_x";

var datePack = {};

for (var i in tasks) {
  var task = tasks[i];
  pcode = projects.indexOf(task.project);
  colindex = pcode * 2;
  if (colData[colindex] == null) {
    colData[colindex] = [task.project + "_x"];
    colData[colindex + 1] = [task.project];
  }
  if (dataSeries[task.project] == null) {
    dataSeries[task.project] = [task];
  } else {
    dataSeries[task.project].push(task);
  }
  var value = 1;
  if (datePack[task.due] == undefined) {
    datePack[task.due] = 1;
  } else {
    value = datePack[task.due] + 1;
    datePack[task.due] = value;
  }

  colData[colindex].push(new Date(task.due));
  colData[colindex + 1].push(value);
}

colData[colData.length] = holidays_x;
colData[colData.length] = holidays;

var zoomKnob = 365;

// create ticks for all dates
var tickValues = [];
var adate = new Date(config.minDate);
var endDate = new Date(config.maxDate);
do {
  tickValues.push(new Date(adate));
  adate.setDate(adate.getDate() + 1);
} while (adate <= endDate);

var chart = c3.generate({
  padding: {
          top: 40,
          right: 40,
          bottom: 40,
          left: 40,
      },
  data: {
    xFormat: config.data.dateFormat,
    xs: xMap,
     columns: colData,
     type: 'scatter',
     colors: config.data.colors,
     types: {
       holidays: 'area',
     }
 },
 axis: {
   x: {
     type: 'timeseries',
     localtime: true,
     tick: {
       values: tickValues,
               format: function(x) {
                 var date = Math.floor(x.getTime() / MILLIS_IN_A_DAY);
                 var ratio = Math.round(zoomKnob / config.timeline.tickCount);
                 if (date % ratio == 0) {
                   return tickDateFormat(x);
                 } else {
                   return "";
                 }
               },
              //  fit: false,
               rotate: 45,
               culling: true
           },
    min: config.minDate,
    max: config.maxDate,
   },
   y: {
     show: false,
     max: 10
   }
 },
 point: {
   r: function(d) {
     if (d.id == 'holidays') {
       return 4;
     } else {
       var r = 8;
       task = dataSeries[d.id][d.index];
       if (task.prio != undefined) {
         return r * (1 + (2 - task.prio) / 2);
       } else {
         return r;
       }
     }
   }
 },
 bar: {
   width: {
     ratio: 1
   }
 },
 zoom: {
   enabled: true,
   extent: [1, 40],
   onzoomend: function (domain) {
     zoomKnob = (domain[1].getTime() - domain[0].getTime()) / MILLIS_IN_A_DAY;
   }
  //  onzoomend: function (domain) {
  //    var diff = domain[1].getTime() - domain[0].getTime();
  //    if (holidaysHidden && (diff < 30 * MILLIS_IN_A_DAY)) {
  //      chart.unload('holidays', {withLegend: true});
  //     //  chart.show('holidays', {withLegend: true});
  //      holidaysHidden = false;
  //    }
  //    if (!holidaysHidden && (diff >= 30 * MILLIS_IN_A_DAY)) {
  //     //  chart.unload('holidays', {withLegend: true});
  //     holidaysHidden = true;
  //    }
  //  }
 },
 tooltip: {
   format: {
       value: function (value, ratio, id, index) {
         return tasks[index].name;
       }
   },
   position: function (data, width, height, element) {
     var dp = data[0];
     var pos = this.tooltipPosition(data, width, height, element);
     if (dp.id == 'holidays') {
       pos.top = pos.top + 15;
       pos.left = pos.left - 15;
     }
     return pos;
  },
   contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
     var dp = d[0];
     if (dp.id == 'holidays') {
       return "<div id='tooltip' class='c3-tooltip-name'>" + tickDateFormat(dp.x) + "</div>";
     } else {
         task = dataSeries[dp.id][dp.index];

           var $$ = this, config = $$.config,
               titleFormat = config.tooltip_format_title || defaultTitleFormat,
               nameFormat = config.tooltip_format_name || function (name) { return name; },
               valueFormat = config.tooltip_format_value || defaultValueFormat,
               text, i, title, value, name, bgcolor;
           for (i = 0; i < d.length; i++) {
               if (! (d[i] && (d[i].value || d[i].value === 0))) { continue; }

               if (! text) {
                   title = task.name;
                   text = "<table id='tooltip' class='c3-tooltip'>" + (title || title === 0 ? "<tr><th colspan='2'>" + title + "</th></tr>" : "");
               }

               name = nameFormat(d[i].name, d[i].ratio, d[i].id, d[i].index);
               bgcolor = $$.levelColor ? $$.levelColor(d[i].value) : color(d[i].id);

               if (task.dscr != undefined) {
                 text += "<tr class='c3-tooltip-name'><td class='name'>" + task.dscr + "</td></tr>";
               }
               text += "<tr class='c3-tooltip-name-" + d[i].id + "'>";
               text += "<td class='name'><span style='background-color:" + bgcolor + "'></span>" + name + "</td>";
               text += "<td class='value'>" + tooltipDateFormat(d[i].x) + "</td>";
               text += "</tr>";
           }
           return text + "</table>";
     }

   }
 }

 });

today = new Date();
 chart.xgrids.add(
   {value: new Date(), text: ('Today ' + tickDateFormat(today))}
 );

holidaysHidden = false;
