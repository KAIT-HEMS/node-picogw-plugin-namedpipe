// namedpipe client
const fs = require('fs');
let log = console.log; // eslint-disable-line no-unused-vars

module.exports = {
    init: init,
};

/**
 * Initialize plugin
 * @param {object} pluginInterface The interface of picogw plugin
 */
function init(pluginInterface) {
    const pi = pluginInterface;
    log = pi.log;

    let pipePrefix = pi.cmd_opts.get('pipe');
    if (!pipePrefix) return;

    // Pipe postfix
    // _r (read port from client's viewpoint)
    // _w (write port from client's viewpoint)
    const PIPE_NAME = {read: pipePrefix+'_w', write: pipePrefix+'_r'};

    const onerror = (msg) => {
        console.error('Error in communicating with named pipe '+pipePrefix+'_r/_w:'); // eslint-disable-line max-len
        console.error(msg);
        console.error('Stoped using named pipe.');
    };
    try {
        console.log('Connecting to named pipe '+pipePrefix+'_r/_w (block until target process is connected.)'); // eslint-disable-line max-len
        // Read stream setup
        let rs = fs.createReadStream(PIPE_NAME.read, 'utf-8');
        let ws;

        let readbuf = '';
        rs.on('data', (data)=>{
            readbuf += data;
            let ri = readbuf.lastIndexOf('\n');
            if (ri<0) return;
            let focus = readbuf.slice(0, ri);
            readbuf = readbuf.slice(ri+1);

            focus.split('\n').forEach((reqStr)=>{
                let req = JSON.parse(reqStr);
                if (req.method.toUpperCase() == 'SUB') {
                    pi.client.subscribe(req.path, (re)=>{
                        ws.write(JSON.stringify(re));
                    });
                    ws.write(JSON.stringify({success: true, tid: req.tid}));
                } else if (req.method.toUpperCase() == 'UNSUB') {
                    pi.client.unsubscribeall(req.path);
                    ws.write(JSON.stringify({success: true, tid: req.tid}));
                } else {
                    pi.client.callproc(req).then((re)=>{
                        re.tid = req.tid;
                        ws.write(JSON.stringify(re)+'\n');
                    }).catch((e)=>{
                        e.tid = req.tid;
                        ws.write(JSON.stringify(e)+'\n');
                    });
                }
            });
        })
            .on('open', ()=>{
                console.log('Read pipe opened.');
            })
            .on('error', (err) =>{
                onerror(JSON.stringify(err));
            })
            .on('close', ()=>{
                pi.client.unsubscribeall();
                onerror('Read pipe closed.');
            });

        // Write stream setup
        ws = fs.createWriteStream(PIPE_NAME.write, 'utf-8');
        ws .on('drain', ()=>{})
            .on('open', ()=>{
                console.log('Write pipe opened.');
            })
            .on('error', (err) =>{
                onerror(JSON.stringify(err));
            })
            .on('close', ()=>{
                pi.client.unsubscribeall();
                onerror('Write pipe closed.');
            });
        // .on('pipe',  src =>{});
    } catch (err) {
        // console.error(err) ;
        console.error('Error in named pipe communication.');
        console.error('Stoped using named pipe.');
        pi.client.unsubscribeall();
    }
}
