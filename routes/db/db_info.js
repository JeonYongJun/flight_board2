module.exports = (function () {
  return {
    real: { // real server db info
      server: '10.1.21.81',
      database: 'EJMMS',
      //port: '1433',
      user: 'sa',
      password: 'password1!',
      stream: true,
      options:{
        //encrypt: true -- for Azure
      }
    },
    dev: { // dev server db info
      server: '10.1.21.81',
      database: 'EJMMS_2018_02_28',
      port: '1433',
      user: 'sa',
      password: 'password1!',
      stream: true,
      options:{
        connectTimeout  : 15000,
        requestTimeout  : 15000
        //encrypt: true -- for Azure
      }
    }
  }
})();
