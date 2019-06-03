const fs = require('fs');
const request = require('request');
const progress = require('request-progress');

module.exports = class DownloadClient {
  constructor({ download_url, filepath }){
    if(typeof download_url === 'undefined'){
      throw new Error('download url required for all requests');
    }
    this.download_url = download_url;

    if(typeof filepath !== 'undefined'){
      this.filepath = filepath;
    }

    this.setup();
  }

  setup() {
    this.api = request.defaults({
      baseUrl: this.download_url,
      headers: {
        'User-Agent': 'VideoGuys/0.1.0/javascript'
      },
      json: true,
      timeout: 120000
    });

    this.request = function(options) {
        delete this.error;
        delete this.progress;
        delete this.completed;
        return new Promise(function(resolve, reject) {
            progress(
                this.api(options)
            )
            .on('progress', function(state){
                this.progress = state;
            }.bind(this))
            .on('error', function(err){
                this.error = err;
                reject(err);
            }.bind(this))
            .on('end', function() {
                this.completed = true;
                resolve(this.filepath);
            }.bind(this))
            .pipe(fs.createWriteStream(this.filepath));
        }.bind(this));
    }.bind(this);
  }

  setfilepath(filepath){
    this.filepath = filepath;
  }

  start(){
    if(typeof this.filepath === 'undefined'){
      throw new Error('filepath is required to start the download');
    }
    
    return this.request({
        uri: '',
        method: 'GET'
    });
  }

  hasCompleted(){
    return this.completed;
  }

  hasError() {
    return this.error;
  }

  hasProgress() {
    return this.progress;
  }
}