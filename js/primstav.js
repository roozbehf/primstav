var projects = ['Q+', 'AppInsight'];
var colors = {
  holidays: '#f99',
  'Q+': '#00b',
  'AppInsight': '#0b0'
};

var minDate = "2016-01-01",
    maxDate = "2016-12-31";

var CLASS = {
    target: 'c3-target',
    chart: 'c3-chart',
    chartLine: 'c3-chart-line',
    chartLines: 'c3-chart-lines',
    chartBar: 'c3-chart-bar',
    chartBars: 'c3-chart-bars',
    chartText: 'c3-chart-text',
    chartTexts: 'c3-chart-texts',
    chartArc: 'c3-chart-arc',
    chartArcs: 'c3-chart-arcs',
    chartArcsTitle: 'c3-chart-arcs-title',
    chartArcsBackground: 'c3-chart-arcs-background',
    chartArcsGaugeUnit: 'c3-chart-arcs-gauge-unit',
    chartArcsGaugeMax: 'c3-chart-arcs-gauge-max',
    chartArcsGaugeMin: 'c3-chart-arcs-gauge-min',
    selectedCircle: 'c3-selected-circle',
    selectedCircles: 'c3-selected-circles',
    eventRect: 'c3-event-rect',
    eventRects: 'c3-event-rects',
    eventRectsSingle: 'c3-event-rects-single',
    eventRectsMultiple: 'c3-event-rects-multiple',
    zoomRect: 'c3-zoom-rect',
    brush: 'c3-brush',
    focused: 'c3-focused',
    defocused: 'c3-defocused',
    region: 'c3-region',
    regions: 'c3-regions',
    tooltipContainer: 'c3-tooltip-container',
    tooltip: 'c3-tooltip',
    tooltipName: 'c3-tooltip-name',
    shape: 'c3-shape',
    shapes: 'c3-shapes',
    line: 'c3-line',
    lines: 'c3-lines',
    bar: 'c3-bar',
    bars: 'c3-bars',
    circle: 'c3-circle',
    circles: 'c3-circles',
    arc: 'c3-arc',
    arcs: 'c3-arcs',
    area: 'c3-area',
    areas: 'c3-areas',
    empty: 'c3-empty',
    text: 'c3-text',
    texts: 'c3-texts',
    gaugeValue: 'c3-gauge-value',
    grid: 'c3-grid',
    gridLines: 'c3-grid-lines',
    xgrid: 'c3-xgrid',
    xgrids: 'c3-xgrids',
    xgridLine: 'c3-xgrid-line',
    xgridLines: 'c3-xgrid-lines',
    xgridFocus: 'c3-xgrid-focus',
    ygrid: 'c3-ygrid',
    ygrids: 'c3-ygrids',
    ygridLine: 'c3-ygrid-line',
    ygridLines: 'c3-ygrid-lines',
    axis: 'c3-axis',
    axisX: 'c3-axis-x',
    axisXLabel: 'c3-axis-x-label',
    axisY: 'c3-axis-y',
    axisYLabel: 'c3-axis-y-label',
    axisY2: 'c3-axis-y2',
    axisY2Label: 'c3-axis-y2-label',
    legendBackground: 'c3-legend-background',
    legendItem: 'c3-legend-item',
    legendItemEvent: 'c3-legend-item-event',
    legendItemTile: 'c3-legend-item-tile',
    legendItemHidden: 'c3-legend-item-hidden',
    legendItemFocused: 'c3-legend-item-focused',
    dragarea: 'c3-dragarea',
    EXPANDED: '_expanded_',
    SELECTED: '_selected_',
    INCLUDED: '_included_'
};

// --- Variables and Constants
var dateFormat = d3.time.format("%Y-%m-%d");
var tooltipDateFormat = d3.time.format("%d %b %Y");
var tickDateFormat = d3.time.format("%d.%m");
const MILLIS_IN_A_DAY = 24 * 3600 * 1000;

// --- combine weekends and holidays
var offdays = {};

// add public holidays
for (var i in publicHolidays) {
  offdays[publicHolidays[i]] = true;
}

// add weekends
var offday = new Date(2016, 0, 2);
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
    holidays[i] = 0.5;
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
var tickCounts = 24;

console.log(xMap);

// create ticks for all dates
var tickValues = [];
var adate = new Date(minDate);
var endDate = new Date(maxDate);
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
    xFormat: "%Y-%m-%d",
    xs: xMap,
     columns: colData,
     type: 'scatter',
     colors: colors,
     types: {
       holidays: 'bar'
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
                 var ratio = Math.round(zoomKnob / tickCounts);
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
    min: minDate,
    max: maxDate,
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
     ratio: 2
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
//            value: d3.format(',') // apply this format to both y and y2
   },
  //  position: function (data, width, height, element) {
  //     var chartOffsetX = document.querySelector("#chart").getBoundingClientRect().left;
  //     var graphOffsetX = document.querySelector("#chart g.c3-axis-y").getBoundingClientRect().right;
  //     var tooltipWidth = document.getElementById('tooltip').parentNode.clientWidth;
  //     var x = (parseInt(element.getAttribute('cx')) ) + graphOffsetX - chartOffsetX - Math.floor(tooltipWidth/2);
  //     var y = element.getAttribute('cy');
  //     var y = y - height - 14;
  //     console.log({top: y, left: x});
  //     return {top: y, left: x}
  // },
   contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
     var dp = d[0];
     if (dp.id != 'holidays') {
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
                 text = "<table id='tooltip' class='" + CLASS.tooltip + "'>" + (title || title === 0 ? "<tr><th colspan='2'>" + title + "</th></tr>" : "");
             }

             name = nameFormat(d[i].name, d[i].ratio, d[i].id, d[i].index);
             bgcolor = $$.levelColor ? $$.levelColor(d[i].value) : color(d[i].id);

             if (task.dscr != undefined) {
               text += "<tr class='" + CLASS.tooltipName + "'><td class='name'>" + task.dscr + "</td></tr>";
             }
             text += "<tr class='" + CLASS.tooltipName + "-" + d[i].id + "'>";
             text += "<td class='name'><span style='background-color:" + bgcolor + "'></span>" + name + "</td>";
             text += "<td class='value'>" + tooltipDateFormat(d[i].x) + "</td>";
             text += "</tr>";
         }
         return text + "</table>";
     } else {
       return "<div id='tooltip' class='" + CLASS.tooltipName + "'>" + dateFormat(dp.x) + "</div>";
     }
   }
 }

 });

holidaysHidden = true;
