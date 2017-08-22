'use strict';

var app = angular.module('app');

app.controller('IndexCtrl', function($interval, $window) {
  // idiom
  var self = this;

  // scope variables
  this.gears = [];

  // angle parameters
  var intervalRate = 0.5;
  var teethSharpnessRate = 0.06;
  var teethTopRate = 1.0 - intervalRate - teethSharpnessRate*2;

  // scale
  var rawHeight = 620;
  var scale = $window.innerHeight/rawHeight/2;

  var _calcRadius = function(teethWidth, teethCount) {
    return teethWidth/(2*Math.sin(Math.PI/teethCount));
  };

  var _makeGear = function(origin, angle, velocity, teethWidth, teethHeight, teethCount,
                           isHand, arcCount, arcInnerMargin, arcOuterMargin, fill, stroke, text, handType) {
    // calculate radius
    var radius = _calcRadius(teethWidth, teethCount);
    // calculate points
    var points = [];
    if (isHand) {
      points = [
        [0, teethWidth/2*-1],
        [teethWidth*-1, 0],
        [0, teethWidth/2],
        [teethHeight, 0]];
      angle -= 90;
    } else {
      _.each(_.range(teethCount), function (i) {
        var anglePerTeeth = 360/teethCount;
        var baseAngle = anglePerTeeth*i;
        var teethStartAngle = baseAngle + anglePerTeeth*intervalRate;
        var teethTopStartAngle = teethStartAngle + anglePerTeeth*teethSharpnessRate;
        var teethTopEndAngle = teethTopStartAngle + anglePerTeeth*teethTopRate;
        points.push(_polarToCartesian(radius - teethHeight, baseAngle));
        points.push(_polarToCartesian(radius - teethHeight, teethStartAngle));
        points.push(_polarToCartesian(radius, teethTopStartAngle));
        points.push(_polarToCartesian(radius, teethTopEndAngle));
      });
    }
    var d = '';
    _.each(points, function(point, index) {
      var pref = index ? 'L ' : 'M ';
      d += pref + (point[0] + radius) + ' ' + (point[1] + radius) + ' ';
    });
    d += 'Z ';

    arcCount = arcCount ? arcCount : 0;
    var innerRadius = arcInnerMargin;
    var outerRadius = radius - arcOuterMargin;
    _.each(_.range(arcCount), function(i) {
      var thetaDiff = 35;
      var thetaStart = 360/arcCount*i;
      var thetaEnd = 360/arcCount*(i + 1);
      var thetaStartInner = thetaStart + thetaDiff/2;
      var thetaEndInner = thetaEnd - thetaDiff/2;
      var thetaStartOuter = thetaStart + innerRadius/outerRadius*thetaDiff/2;
      var thetaEndOuter = thetaEnd - innerRadius/outerRadius*thetaDiff/2;
      var innerStart = _.map(_polarToCartesian(innerRadius, thetaStartInner), function(x) { return x + radius; });
      var innerEnd = _.map(_polarToCartesian(innerRadius, thetaEndInner), function(x) { return x + radius; });
      var outerStart = _.map(_polarToCartesian(outerRadius, thetaStartOuter), function(x) { return x + radius; });
      var outerEnd = _.map(_polarToCartesian(outerRadius, thetaEndOuter), function(x) { return x + radius; });
      d += 'M ' + innerStart[0] + ' ' + innerStart[1] + ' ';
      d += 'A ' + innerRadius + ' ' + innerRadius + ' 0 0 1 ' + innerEnd[0] + ' ' + innerEnd[1] + ' ';
      d += 'L ' + outerEnd[0] + ' ' + outerEnd[1];
      d += 'A ' + outerRadius + ' ' + outerRadius + ' 0 0 0 ' + outerStart[0] + ' ' + outerStart[1] + ' ';
      d += 'Z';
    });

    var rText = radius - 40;
    var textPathD = 'M ' + radius + ' ' + radius + ' m 0 ' + rText*-1 + ' a ' + rText + ' ' + rText + ' 0 1,1 -1,0';

    return {
      points: points,
      d: d,
      origin: origin,
      angle: angle,
      velocity: velocity,
      radius: radius,
      teethCount: teethCount,
      teethWidth: teethWidth,
      teethHeight: teethHeight,
      isHand: isHand,
      style: {
        'opacity': 1,
        'width': isHand ? teethWidth : radius*2,
        'height': isHand ? teethHeight : radius*2,
        'transform': 'translate3d('
        + (origin[0]*scale - radius) + 'px, '
        + (origin[1]*scale - radius) + 'px, 0px) '
        + 'rotate(' + angle + 'deg)'
        + ' scale(' + scale + ')',
        'transform-origin': radius + 'px ' + radius + 'px'
      },
      rotate: 'rotate(' + angle + ' ' + radius + ' ' + radius + ')',
      viewbox: [0, 0, radius*2, radius*2].join(" "),
      fill: fill,
      stroke: stroke,
      text: text,
      textPathD: textPathD,
      handType: handType
    };
  };

  var _makeGearSetting = function(teethWidth, teethHeight, teethCount, teethJoint,
                                  parentIndex, joinAxis, isHand, arcCount, arcInnerMargin, arcOuterMargin,
                                  fill, stroke, text, handType) {
    return {
      teethWidth: teethWidth,
      teethHeight: teethHeight,
      teethCount: teethCount,
      teethJoint: teethJoint,
      parentIndex: parentIndex,
      joinAxis: joinAxis,
      isHand: isHand,
      arcCount: arcCount,
      arcInnerMargin: arcInnerMargin,
      arcOuterMargin: arcOuterMargin,
      fill: fill,
      stroke: stroke,
      text: text,
      handType: handType
    };
  };

  var _randomGenerateGearSettings = function(baseGear) {
    var settings = [];
    var count = _.random(3, 4);
    var handCount = 2;
    var minParent = 0;
    _.each(_.range(count), function(i) {
      var isJoinAxis = Math.random() < 0.15;
      var isHand = handCount > 0 ? Math.random() < 0.05 : false;
      var parentIndex = _.random(minParent, i);
      var parent = settings[parentIndex];
      var teethCount;
      if (isJoinAxis) {
        minParent = i;
        teethCount = _.random(10, 20);
        var teethWidth = _.random(10, 25);
        var teethHeight = teethWidth*(0.9 + Math.random()*0.2)/2;
        settings.push(_makeGearSetting(teethWidth, teethHeight, teethCount, 0, parentIndex, true, false));
      } else if (isHand) {
        minParent = i;
        settings.push(_makeGearSetting(
          parent ? parent.teethWidth : baseGear.teethWidth,
          parent ? parent.teethHeight : baseGear.teethHeight,
          parent ? parent.teethCount : baseGear.teethCount,
          0, parentIndex, true, true));
      } else {
        teethCount = _.random(20, 60);
        var parentTeethCount = parent ? parent.teethCount : baseGear.teethCount;
        var teethJoint = _.random(parentTeethCount*0.25, parentTeethCount*0.75);
        settings.push(_makeGearSetting(
          parent ? parent.teethWidth : baseGear.teethWidth,
          parent ? parent.teethHeight : baseGear.teethHeight,
          teethCount, teethJoint, parentIndex, false, false));
      }
    });
    return settings;
  };

  var _presetGearSettings = function() {
    var settings = [];
    settings.push(_makeGearSetting(18, 8, 10, 0, 0, true, false, 0, 0, 0, '#ddd', '#566'));
    settings.push(_makeGearSetting(18, 8, 75, 5, 1, false, false, 5, 42, 39, '#eed', '#566'));
    settings.push(_makeGearSetting(18, 8, 10, 0, 2, true, false, 0, 0, 0, '#ddd', '#566'));
    settings.push(_makeGearSetting(18, 8, 80, 0, 3, false, false, 5, 54, 51, '#eed', '#566'));
    settings.push(_makeGearSetting(26, 11, 12, 0, 4, true, false, 0, 0, 0, '#ddd', '#566'));
    settings.push(_makeGearSetting(26, 11, 72, 6, 5, false, false, 0, 0, 0, '#ddd', '#566', 'clockhand.net'));
    settings.push(_makeGearSetting(26, 11, 36, 0, 5, false, false, 0, 0, 0, '#ddd', '#566'));
    settings.push(_makeGearSetting(26, 11, 10, 0, 7, true, false, 0, 0, 0, '#ddd', '#566'));
    settings.push(_makeGearSetting(26, 11, 40, 5, 8, false, false, 0, 0, 0, '#ddd', '#566'));
    settings.push(_makeGearSetting(15, 330, 30, 6, 1, true, true, 0, 0, 0, 'rgb(0, 0, 0)', '#566', null, 'seconds'));
    settings.push(_makeGearSetting(30, 380, 30, 6, 5, true, true, 0, 0, 0, 'rgb(0, 0, 0)', '#566', null, 'minutes'));
    settings.push(_makeGearSetting(60, 240, 30, 6, 9, true, true, 0, 0, 0, 'rgb(0, 0, 0)', '#566', null, 'hours'));
    return settings;
  };

  var _polarToCartesian = function(r, angle) {
    return [r*Math.cos(angle/180*Math.PI), r*Math.sin(angle/180*Math.PI)];
  };

  // set base gear
  self.gears.push(_makeGear([0, 0], 0, 0.1, 18, 8, 60, false, 3, 33, 36, '#eed', '#566'));

  // random generate gears
  var gearSettings = _presetGearSettings(self.gears[0]);

  // set gears by settings
  _.each(gearSettings, function(setting) {
    // parent setting
    var parent = self.gears[setting.parentIndex];

    // variables
    var teethWidth, teethHeight, origin, angle, velocity;

    if (setting.joinAxis) {
      // teeth width & height
      teethWidth = setting.teethWidth;
      teethHeight = setting.teethHeight;
      // calculate origin
      origin = parent.origin;
      // calculate angle
      angle = 0;
      // calculate velocity
      velocity = parent.velocity;
    } else {
      // teeth width & height
      teethWidth = parent.teethWidth;
      teethHeight = parent.teethHeight;
      // calculate radius
      var radius = _calcRadius(teethWidth, setting.teethCount);
      // calculate origin
      var diff = _polarToCartesian(parent.radius + radius - teethHeight, parent.angle + setting.teethJoint*360/parent.teethCount);
      origin = [parent.origin[0] + diff[0], parent.origin[1] + diff[1]];
      // calculate angle
      angle = parent.angle + setting.teethJoint*360.0/parent.teethCount - 180;
      // calculate velocity
      velocity = -1*parent.velocity*parent.teethCount/setting.teethCount;
    }

    self.gears.push(
      _makeGear(
        origin,
        angle,
        velocity,
        teethWidth,
        teethHeight,
        setting.teethCount,
        setting.isHand,
        setting.arcCount,
        setting.arcInnerMargin,
        setting.arcOuterMargin,
        setting.fill,
        setting.stroke,
        setting.text,
        setting.handType
      )
    );
  });

  var _getSvgLabel = function() {
    var as = self.gears[10].angle + 90;
    var am = self.gears[11].angle + 90 + 1.5;
    var ah = self.gears[12].angle + 90;
    var s = Math.floor(((as%360 + 360)%360)/360*60);
    var m = Math.floor(((am%360 + 360)%360)/360*60);
    var h = Math.floor(((ah%360 + 360)%360)/360*12);
    return h + ':' + m  + ':' + s;
  };

  var _getSvgTime = function() {
    var ah = self.gears[12].angle + 90;
    return ((ah%360 + 360)%360)/360*12*60*60;
  };

  var _calcAcceleration = function() {
    var date = new Date();
    var seconds = date.getSeconds();
    var minutes = date.getMinutes();
    var hours = date.getHours()%12;
    var targetTime = seconds + minutes*60 + hours*60*60;
    var svgTime = _getSvgTime();
    var diff = targetTime - svgTime;
    return diff >= -10 ? diff : diff + 60*60*12;
  };

  var _calcSecondsAcceleration = function(gear) {
    var date = new Date();
    var seconds = date.getSeconds();
    var as = gear.angle + 90;
    var svgSeconds = ((as%360 + 360)%360)/360*60;
    var diff = seconds - svgSeconds;
    return diff >= -1 ? diff : diff + 60;
  };

  var _calcMinutesAcceleration = function(gear) {
    var date = new Date();
    var minutes = date.getMinutes();
    var am = gear.angle + 90;
    var svgMinutes = ((am%360 + 360)%360)/360*60;
    var diff = minutes - svgMinutes;
    return diff >= -1 ? diff : diff + 60;
  };

  var update = function() {
    scale = $window.innerHeight/rawHeight/2;
    var acceleration = _calcAcceleration();
    _.each(self.gears, function(gear) {
      var v = gear.velocity*acceleration*2;
      if (gear.handType === 'seconds') {
        v = _calcSecondsAcceleration(gear)/4;
      } else if (gear.handType === 'minutes') {
        v = _calcMinutesAcceleration(gear)/9;
      }
      gear.angle += v;
      gear.style.transform = 'translate3d('
        + (gear.origin[0]*scale - gear.radius) + 'px, '
        + (gear.origin[1]*scale - gear.radius) + 'px, 0px) '
        + 'rotate(' + gear.angle + 'deg) '
        + 'scale(' + scale + ')';
    });
    self.acceleration = acceleration;

    var date = new Date();
    var seconds = date.getSeconds();
    var minutes = date.getMinutes();
    var hours = date.getHours()%12;
    self.targetTime = seconds + minutes*60 + hours*60*60;
    self.svgTime = _getSvgTime();
    self.svgLabel = _getSvgLabel();
  };

  $interval(function() {
    update();
  }, 1000/60);

  this.handler = {
    getPoints: function(gear) {
      return _.join(_.map(gear.points, function(point) {
        return (point[0] + gear.radius) + ',' + (point[1] + gear.radius);
      }), ' ');
    }
  };

  console.log(self.gears);
});
