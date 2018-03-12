var moment = require('moment');

exports.getdate = function(dd,delta){
  if(!dd) dd = new Date();
    var _date = moment(dd,'YYYY-MM-DD');
    _date.add(delta,'days');
    return _date.format('YYYY-MM-DD');
}
