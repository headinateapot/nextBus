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
        return function calculateEtaInMinutes(busInfoArray) {
            var arrivalTimestamp = busInfoArray[4];
            return (arrivalTimestamp - nowInMilliseconds) / 1000 / 60;
        };
    }

    function humanReadableEtaInMinutes(etaInMinutes) {
        return (etaInMinutes < 1)? 'due' : Math.round(etaInMinutes) + ' mins';
    }

    function processBusInfoDataFactory(busRoute) {
        return function processBusInfoData(dataStr) {
            var busInfoArrays = parseLineDelimitedJson(dataStr);
            var busInfoOnRoute = _.filter(busInfoArrays, isRightBusFactory(busRoute));

            var now = Date.now();
            var nextBusesEta = _.map(busInfoOnRoute, calculateEtaInMinutesFactory(now));
            console.log(nextBusesEta);
            var hNextBusesEta = _.map(nextBusesEta, humanReadableEtaInMinutes);

            $('#content').text(hNextBusesEta.join());
            
            
        };
    }

    function getNextBusesEta(busStop) {
        var busStopId = busStops[busStop].busStopId;
        var busRoute = busStops[busStop].busLineName;

        var busCountDownUrl = countDownUrl(busStopId);

        $.ajax({
            url: busCountDownUrl,
            data: null,
            success: processBusInfoDataFactory(busRoute),
            dataType: 'text'
        });
    }

    $(function() {
        var busStop = 'mountViewRoad';
        //var busStop = 'finsburyPark';
        getNextBusesEta(busStop);
    });

})();