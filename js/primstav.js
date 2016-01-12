//
// Primstav Task Calendar
// Copyright (c) 2016 Roozbeh Farahbod
//

// --- Primstav Configuration
var config_def = {
  tasksURL: "data/worktasks.json",
  holidaysURL: "data/holidays.json",
  awayURL: "data/workaway.json",
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

var data = {
  tasks: [],
  holidays: [],
  away: []
};

// --- Import custom configuration
var config = (JSON.parse(JSON.stringify(config_def)));
if (typeof primstavconfig !== 'undefined') {
  config = $.extend(true, {}, config, primstavconfig);
}

// --- Variables and Constants
const MILLIS_IN_A_DAY = 24 * 3600 * 1000;
var labelsDrawn = false;

var weekdayFormat = d3.time.format("%a");
var monthFormat = d3.time.format("%b");
var dateFormat = d3.time.format(config.data.dateFormat);
var tooltipDateFormat = d3.time.format(config.tooltip.dateFormat);
var tickDateFormat = d3.time.format(config.timeline.dateFormat);

function loadJSON(deferred, url, loadfunc, doneMsg, failMsg) {
  if (url != undefined) {
      $.getJSON(url, loadfunc)
        .done(function() {
          console.log(doneMsg);
        })
        .fail(function() {
          console.log(failMsg)
        })
        .complete(function() {
          deferred.resolve();
        })
  }
}

// --- Load tasks data
function loadTasks(deferred) {
  loadJSON(deferred,
    config.tasksURL,
    function (dt) {
      data.tasks = $.extend(true, {}, dt);
    },
    "Loaded tasks.",
    "Could not load tasks. Please check the configuration."
  )
}

// --- Load holidays
function loadHolidays(deferred) {
  loadJSON(deferred,
    config.holidaysURL,
    function (dt) {
      data.holidays = $.extend(true, {}, dt);
    },
    "Loaded holidays.",
    "Could not load holidays. Please check the configuration."
  )
}

// --- Load away times
function loadAwayTimes(deferred) {
  loadJSON(deferred,
    config.awayURL,
    function (dt) {
      data.away = $.extend(true, {}, dt);
    },
    "Loaded away times.",
    "Could not load away time data. Please check the configuration."
  )
}

function startTimePeriod(date, targetArray) {
  var update = new Date(date);
  update.setHours(0);
  targetArray.push(update);
  var thedate = new Date(date);
  thedate.setHours(1);
  targetArray.push(thedate);
}

function endTimePeriod(date, targetArray) {
  var thedate = new Date(date);
  thedate.setHours(22);
  targetArray.push(thedate);
  var downdate = new Date(date);
  downdate.setHours(23);
  targetArray.push(downdate);
}


// http://stackoverflow.com/questions/31957446/text-inside-each-bubble-in-c3js-scatter-plot
function drawLabels(chartInternal) {
  if (chartInternal != undefined) {
    var textLayers = chartInternal.main.selectAll('.' + c3.chart.internal.fn.CLASS.texts);
    for (var i = 0; i < textLayers[0].length; i++) {
        // select each of the scatter points
        chartInternal.mainCircle[i].forEach(function (point, index) {
          if (dataSeries[i] != undefined) {
            task = dataSeries[i][index];
            if (task != undefined) {
              var d3point = d3.select(point);
              cx = d3point.attr('cx');
              cy = d3point.attr('cy');
              dx = Number(cx) + 40;
              d3.select(textLayers[0][i])
                  .append('text')
                  // center horizontally and vertically
                  // .style('text-anchor', 'middle').attr('dy', '.3em')
                  .text(dataSeries[i][index].name)
                  .attr('class', 'prim-node-name')
                  // same as at the point
                  .attr('x', dx)
                  .attr('y', cy - 100);
              d3.select(textLayers[0][i])
                  .append("line")
                    .style("stroke", "#999")
                    .attr("x1", cx)
                    .attr("y1", cy)
                    .attr("x2", dx)
                    .attr("y2", (cy - 100));
            }
          }
        })
    }
  }
}

function drawPrimstav(deferred) {

  function updateHolidays(domain) {
    ratio = (chart.internal.width / zoomKnob);
    lastWindow = {
      left: domain[0],
      right: domain[1]
    };
    if (holidaysHidden && ratio >= config.holidays.point.showRatio) {
      chart.show('holidays');
      chart.zoom(domain);
      holidaysHidden = false;
    }
    if (!holidaysHidden && ratio < config.holidays.point.hideRatio) {
      chart.hide('holidays');
      console.log("hiding them!")
      chart.zoom(domain);
      holidaysHidden = true;
    }
  }

  function dataPointTask(d) {
    return dateTasks[dateFormat(d.x)][d.value];
  }

  // --- get project names
  var projectSet = {};
  for (var i in data.tasks) {
    projectSet[data.tasks[i].project] = true;
  }
  var projects = [];
  for (var p in projectSet) {
    projects.push(p);
  }

  // --- combine weekends and holidays
  var offdays = {};

  // add public holidays
  for (var i in data.holidays) {
    offdays[data.holidays[i]] = true;
  }

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

  offdates = [];
  for (var prop in offdays) {
    offdates.push(new Date(prop));
  }
  offdates.sort(function (a, b) { return a.getTime() - b.getTime();});

  var holidays_x = ["holidays_x"];
  for (var i in offdates) {
    if (i == 0) {
      startTimePeriod(offdates[i], holidays_x);
    } else {
      if (i == offdates.length - 1) {
        endTimePeriod(offdates[i], holidays_x);
      } else {
        var prevdate = offdates[i - 1];
        if (offdates[i].getTime() - prevdate.getTime() > MILLIS_IN_A_DAY) {
          endTimePeriod(prevdate, holidays_x);
          startTimePeriod(offdates[i], holidays_x);
        }
      }
    }
  }

  var holidays = ["holidays"];
  for (var i in holidays_x) {
    if (i > 0) {
      if (holidays_x[i].getHours() % 23 == 0) {
        holidays[i] = 0;
      } else {
        holidays[i] = config.holidays.value;
      }
    }
  }

  var colData = [];
  var xMap = {};
  var dateTasks = {};
  var dataSeries = [];

  for (var i in projects) {
    var pname = projects[i];
    xMap[pname] = pname + "_x";
  }

  xMap["holidays"] = "holidays_x";

  today = new Date();
  var datePack = {};
  var originalWindow = {
    left: today,
    right: today
  };

  for (var i in data.tasks) {
    var task = data.tasks[i];
    task.dueDate = new Date(task.due);

    // get the task's project
    pcode = projects.indexOf(task.project);
    colindex = pcode * 2;

    // if column data for the project does not exist, crate it
    if (colData[colindex] == null) {
      colData[colindex] = [task.project + "_x"];
      colData[colindex + 1] = [task.project];
    }

    // keep track of tasks on the same date, to rais their Y value
    var value = 1;
    if (datePack[task.due] == undefined) {
      datePack[task.due] = 1;
    } else {
      value = datePack[task.due] + 1;
      datePack[task.due] = value;
    }

    // update the date tasks
    if (dateTasks[task.due] == null) {
      dateTasks[task.due] = [];
    }
    dateTasks[task.due][value] = task;

    // update the data series
    if (dataSeries[pcode] == null) {
      dataSeries[pcode] = [task];
    } else {
      dataSeries[pcode].push(task);
    }

    // add the task to the appropriate column
    taskDate = new Date(task.due);
    taskDate.setHours(12);
    colData[colindex].push(taskDate);
    colData[colindex + 1].push(value);

    // update the original view window
    if (taskDate < originalWindow.left) {
      originalWindow.left = taskDate;
    } else {
      if (taskDate > originalWindow.right) {
        originalWindow.right = taskDate;
      }
    }
  }

  colData[colData.length] = holidays_x;
  colData[colData.length] = holidays;

  // --- put together away data
  aways_x = ['away_x'];
  aways = ['away'];
  var awayObjs = [];
  for (var i in data.away) {
    a = data.away[i];
    startTimePeriod(a.from, aways_x);
    awayObjs.push(a); awayObjs.push(a);
    endTimePeriod(a.to, aways_x);
    awayObjs.push(a); awayObjs.push(a);
  }
  for (var i in aways_x) {
    if (i > 0) {
      if (aways_x[i].getHours() % 23 == 0) {
        aways[i] = 0;
      } else {
        aways[i] = config.away.value;
      }
    }
  }
  colData[colData.length] = aways_x;
  colData[colData.length] = aways;
  xMap["away"] = "away_x";
  console.log(aways);
  console.log(aways_x);

  // sort data series
  for (var i in dataSeries) {
    dataSeries[i].sort(function srt(a, b) { return a.dueDate.getTime() - b.dueDate.getTime();});
  }

  // update view range
  originalWindow.left = new Date(originalWindow.left);
  originalWindow.left.setDate(originalWindow.left.getDate() - 7);
  originalWindow.right = new Date(originalWindow.right);
  originalWindow.right.setDate(originalWindow.right.getDate() + 7);
  var zoomKnob = Math.round((originalWindow.right.getTime() - originalWindow.left.getTime()) / MILLIS_IN_A_DAY);

  // create ticks for all dates
  var tickValues = [];
  var adate = new Date(config.minDate);
  adate.setHours(12);
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
       away: 'area'
      }
  },
  legend: {
    hide: ['holidays', 'away']
  },
   axis: {
     x: {
       type: 'timeseries',
       tick: {
         values: tickValues,
         format: function(x) {
           dow = weekdayFormat(x);
           var date = Math.floor(x.getTime() / MILLIS_IN_A_DAY);
           var ratio = Math.round(zoomKnob / config.timeline.tickCount);
           if (date % ratio == 0) {
            return tickDateFormat(x) + " " + dow;
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
         return config.holidays.point.r;
       } else {
         if (d.id == 'away') {
           return config.away.point.r;
         } else {
           var r = 8;
           task = dataPointTask(d);
           if (task.prio != undefined) {
             return r * (1 + (2 - task.prio) / 2);
           } else {
             return r;
           }
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
       updateHolidays(domain);
     }
   },
   onresize: function() {updateHolidays([lastWindow.left, lastWindow.right]);},
   // onrendered: function () {
   //   if (!labelsDrawn) {
   //     drawLabels(this.internal);
   //     labelsDrawn = true;
   //   } else {
   //     var $$ = this;
   //     // remove existing labels
   //     this.main.selectAll('.' + c3.chart.internal.fn.CLASS.texts).selectAll('*').remove();
   //
   //     setTimeout(function () {
   //         drawLabels($$)
   //     // add a small duration to make sure the points are in place
   //     }, this.config.transition_duration + 100)
   //   }
   // },
   tooltip: {
     format: {
         value: function (value, ratio, id, index) {
           return data.tasks[index].name;
         }
     },
     position: function (data, width, height, element) {
       var dp = data[0];
       var pos = this.tooltipPosition(data, width, height, element);
       if (dp.id == 'holidays' || dp.id == 'away') {
         pos.top = pos.top + 15;
         pos.left = pos.left - 20;
       }
       return pos;
    },
     contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
       var dp = d[0];
       if (dp.id == 'holidays') {
         dow = dp.x.getDay();
         reason = (dow == 0) ? 'Sun.' : ((dow == 6) ? 'Sat.' : 'Public')
         return "<div id='tooltip' class='prim-tooltip-holiday'>" + reason + " " + tickDateFormat(dp.x) + "</div>";
       } else {
         if (dp.id == 'away') {
           awayobj = awayObjs[dp.index];
           return "<div id='tooltip' class='prim-tooltip-away'>" + awayobj.name + "</div>";
         } else {
           task = dataPointTask(dp);

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
                 text += "<td class='value'>" + tooltipDateFormat(d[i].x) + "</td>";
                 text += "<td class='name'><span style='background-color:" + bgcolor + "'></span>" + name + "</td>";
                 text += "</tr>";
             }
             return text + "</table>";
         }
       }

     }
   }

   });

  var holidaysHidden = true;
  chart.hide('holidays');

  // update initial zoom
  chart.zoom([originalWindow.left, originalWindow.right]);
  var lastWindow = $.extend(true, {}, originalWindow);

  var grids = [{value: new Date(), length: 50, class: 'today', text: ('Today ' + tickDateFormat(today))}];
  mindate = new Date(config.minDate);
  maxdate = new Date(config.maxDate);
  year1 = mindate.getFullYear();
  year2 = maxdate.getFullYear();
  for (var year = year1; year <= year2; year++) {
    for (var mon = 1; mon < 13; mon++) {
      firstdateofmonth = new Date(year, mon, 1);
      grids.push({value: firstdateofmonth, text: monthFormat(firstdateofmonth)})
    }
  }

  chart.xgrids.add(
   grids
  );

  deferred.resolve();
}

// -- Load data
var loadData = function() {
  var defTasks = new $.Deferred();
  loadTasks(defTasks);

  var defH = new $.Deferred();
  loadHolidays(defH);

  var defAway = new $.Deferred();
  loadAwayTimes(defAway);

  defTasks.then(defH).then(defAway);

  return defAway;
}

var drawVisuals = function() {
  console.log("Drawing the board...");
  var deferred = new $.Deferred();
  drawPrimstav(deferred);
  console.log("Drawing the board done.");
  return deferred;
}

loadData().then(drawVisuals).done(function() {console.log("All done.")});

// $.when(loadData(), drawVisuals()).done(function() {
//   console.log("happy?")
// });
