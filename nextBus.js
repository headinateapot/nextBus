(function() {

    var busStops = {
      'mountViewRoad': {
         'busStopId': '18898',
         "busLineName": 'W3',
         'butStopName': 'Mount View Road'
      },
      'finsburyPark': {
         'busStopId': 'BP002',
         "busLineName": 'W3',
         'busStopName': ''
      }
    };

    function countDownUrl(stopId) {
        return 'http://countdown.api.tfl.gov.uk/interfaces/ura/instant_V1?Stopid=' + stopId + '&ReturnList=Stoppointname,LineName,DestinationName,EstimatedTime';
    }

    function parseLineDelimitedJson(dataStr) {
       console.log(dataStr);
       var lines = dataStr.split('\n');
       console.log(lines);
       var jsonsArray = _.map(lines, JSON.parse);
       console.log(jsonsArray);
       return jsonsArray;
    }

    function isRightBusFactory(busLineName) {
        return function isRightBus(busInfoArray) {
            return busInfoArray.length === 5 && busInfoArray[2] === busLineName;
        };
    }

    function calculateEtaInMinutesFactory(nowInMilliseconds) {
        return function calculateEtaInMinutes(busInfo) {
            var arrivalTimestamp = busInfo.estimatedTime;
            return (arrivalTimestamp - nowInMilliseconds) / 1000 / 60;
        };
    }

    function humanReadableEtaInMinutes(etaInMinutes) {
        return (etaInMinutes < 1)? 'due' : Math.round(etaInMinutes) + ' mins';
    }

    function toBusInfo(busInfoArray) {
        var isSafeToRead = _.isArray(busInfoArray) && busInfoArray.length === 5;

        return {
            lineName: isSafeToRead ? busInfoArray[2] : '',
            stopPointName: isSafeToRead ? busInfoArray[1] : '',
            destinationName: isSafeToRead ? busInfoArray[3] : '',
            estimatedTime: isSafeToRead ? busInfoArray[4] : 0  //TODO: review
        };
    }

    function toNextBusEtaInfo(busStopId, busInfoObjArray, humanReadableNextBusesEtaArray) {
        var safeBusInfoObjArray = _.isArray(busInfoObjArray) ? busInfoObjArray : [];
        var safeHNextBusesEtaArray = _.isArray(humanReadableNextBusesEtaArray) ? humanReadableNextBusesEtaArray : [];

        var busInfoObj = _.head(safeBusInfoObjArray) || {};

        return {
            busStopId: busStopId,
            lineName: busInfoObj.lineName || '',
            stopPointName: busInfoObj.stopPointName || '',
            destinationName: busInfoObj.destinationName || '',
            nextBusesEta: safeHNextBusesEtaArray
        };
    }

    function calculateNextBusEtaInfo(dataStr, busStopId, busLineName) {
        var busInfoArrays = parseLineDelimitedJson(dataStr);
        var busInfoArraysOnRoute = _.filter(busInfoArrays, isRightBusFactory(busLineName));
        var busInfoObjs = _.orderBy(_.map(busInfoArraysOnRoute, toBusInfo), ['estimatedTime'], ['asc']);

        var now = Date.now();
        var nextBusesEta = _.map(busInfoObjs, calculateEtaInMinutesFactory(now));
        console.log(nextBusesEta);
        var hNextBusesEta = _.map(nextBusesEta, humanReadableEtaInMinutes);

        return toNextBusEtaInfo(busStopId, busInfoObjs, hNextBusesEta);
    }

    function renderNextBusEtaView($elem, nextBusEtaInfo) {
        var titleElem = '<h5>' + nextBusEtaInfo.lineName + ' from ' + nextBusEtaInfo.stopPointName + ' to ' + nextBusEtaInfo.destinationName + '</h5>';
        var listElem = _.map(nextBusEtaInfo.nextBusesEta, function(eta) {
            return '<li>' + eta + '</li>';
        }).join('\n');
        var divElem = '<div class="bus" id="' + nextBusEtaInfo.busStopId + '">' + titleElem +
            '<ul class="nextBusEta">\n' + listElem + '</ul></div>';
        $elem.append(divElem);
    }

    function displayNextBusEtaFactory(busStopId, busLineName, $elem) {
        return function displayNextBusEta(dataStr) {
            var nextBusEtaInfo = calculateNextBusEtaInfo(dataStr, busStopId, busLineName);
            renderNextBusEtaView($elem, nextBusEtaInfo);
        };
    }

    function getNextBusesEta(busStop, $elem) {
        var busStopId = busStops[busStop].busStopId;
        var busLineName = busStops[busStop].busLineName;

        var busCountDownUrl = countDownUrl(busStopId);

        $.ajax({
            url: busCountDownUrl,
            data: null,
            success: displayNextBusEtaFactory(busStopId, busLineName, $elem),
            dataType: 'text'
        });
    }

    $(function() {
        var $content = $('#content');
        var busStops = ['mountViewRoad', 'finsburyPark'];
        _.each(busStops, function(busStop) {
            getNextBusesEta(busStop, $content);
        });
    });

})();