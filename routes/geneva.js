var express = require('express');
var axios = require('axios')
var JSSoup = require('jssoup').default;
var router = express.Router();

function sector_to_json(sectors){
    let tags = ['SectorKey','Rego','FlightNumber','STD','LSTD','STA','LSTA',
                'ETD','LETD','ETA','LETA','ATD','LATD','ATA','LATA','Crew',
                'SchedDepPort','SchedArrPort'];
    var jsons = [];
    for(i in sectors){
        var json = {};
        for(j in tags){
            //console.log(t);
            json[tags[j]] = sectors[i].find(tags[j]).getText('|')
        }
        jsons.push(json)
    }
    return jsons
}

/* GET geneva info. */
router.get('/:date', function(req, res, next) {
    var date = req.params.date;
    console.log('/geneva',req.params);
    var url = `http://ze-crewnet.eastarjet.com/TickerWebClient/Ticker/TickerWeb/data/Doo${date}.xml`;
    axios.get(url, {}).then(function (response) {
        //console.log(response);
        var result = {}
        var cycles = new JSSoup(response.data).findAll('Cycle')
        for(i in cycles)
            result[cycles[i].find('CycleKey').text] = sector_to_json(cycles[i].findAll('Sector'))
        //console.log(result);
        //res.setHeader('Content-Type', 'application/json');
        //res.send({result:'test'});
        res.send(result);
    }).catch(function (error) {
        console.log(error);
      });
  });

module.exports = router;