var tp       = require('torrent-project-api')
var epparser = require('video-name-parser');
var _        = require('lodash');
var cheerio  = require('cheerio')
var https    = require('https');

function metacb(query, options, resolve, reject){
return function (err, res){
    if(err) {
        reject(err);
        return console.error(err);
    }

    var self = this;
    self.res = res;

    // filter found torrents that have a known show name, episode and season
    var torrents = _.filter(res.torrents, function(torrent){
        var parsed = epparser(torrent.title);
        if(!parsed) return false;
        return parsed.name && parsed.season && parsed.episode;
    });

    console.log(`${(torrents.length / res.torrents.length)*100}% filtered `+
                `for query ${query}`);

    // add parsed data and format size info
    torrents = _.map(torrents, function(torrent){
        var parsed  = epparser(torrent.title);
        parsed.show = parsed.name;
        if(_.isArray(parsed.episode) && parsed.episode.length === 1){
            parsed.episode = parsed.episode[0];
        }
        torrent.parsed = parsed;
        torrent.size   = (torrent.size / 1024 / 1024).toFixed(2) + " MB"
        tp.magnet(torrent, function(err, link){
            if(err){
                console.error(err);
                reject(err);
            }else{
                torrent.magnet = link;
            }
        });
        return torrent;
    });
    var shows = _.sortBy(torrents, 'parsed.episode');
    /* group filtered torrents by show name
    var shows = _.groupBy(torrents, function(torrent){
        return torrent.parsed.show;
    });
    shows = _.map(_.keys(shows), function(key){
        return { title: key, episodes: shows[key] };
    });
    // group episodes in every show by episode number
    shows = _.map(shows, function(show){
        show.episodes = _.groupBy(show.episodes, function(ep){
            return ep.parsed.episode;
        });
        return show;
    });
    //*/
    // get total pages parsing html
    var buf = [];
    var url = `https://torrentproject.se/?hl=en&safe=off&num=${options.limit}`+
              `&start=${options.page || 0}&orderby=${options.order}`+
              `&s=${query.trim().replace(/\s+/g, '+')}&filter=2000`;
    https.get(url, function(res){
        res.on('data', function(data){
            buf.push(data);
        });
        res.on('end', function(){
            var html = Buffer.concat(buf).toString();
            $ = cheerio.load(html);
            var page_elem = $('#nav>tbody>tr>td:last-child');
            self.pages = parseInt(page_elem.text(), 10) || 1;
            var result = { totalPages: self.pages, currentPage: options.page+1 || 1,
                total: self.res.total,
                received: self.res.torrents.length,
                filtered: torrents.length, torrents: shows };
            resolve(result);
        });
        res.on('error', function(err){
            console.log(err);
            reject(err);
        });
    });

}
}

/** Returns a promise that will resolve when torrents are parsed and grouped
 * and will reject if there was any problem doing the requests or parsing the results
 *  @param {string} query - Keywords for querying the api
 *  @param {Object} options - An object that may contain the following properties:
 *           limit:  max results per page
 *           page:   page number
 *           filter: filter by the following video categories:
 *                            video (contains all the others), tv (default),
 *                            dvd, dvdrip, hdrip, lq
 *           order:  order by best, latest, seeders,
 *                            oldest, speed, peers (default),
 *                            sizeD, sizeA
 */
module.exports = function(query, options){
    options  = options || {};
    var page = (options.page && options.page > 0)? options.page-1 : 0;
    options.limit  = options.limit  || 20;
    options.order  = options.order  || 'peers';
    options.filter = options.filter || 'tv';
    options.page   = page;
    return new Promise(function(resolve, reject){
        var cb = metacb(query, options, resolve, reject);
        tp.search(query, options, cb);
    });
}