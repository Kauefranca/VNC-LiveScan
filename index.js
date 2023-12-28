require('dotenv').config()
const { isIP } = require('net');
const { parse } = require('node-xlsx');
const prompt = require("prompt-sync")({ sigint: true });
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const VNCViewerPath = `"${process.env.VNC_VIEWER_PATH}"`;
const xlsxPath = process.env.XLSX_PATH;
const SubNet = process.env.SUBNET;

const normalize = (mac) => mac.replace(/\-/g, ':').toLowerCase().trim();
const isMAC = (mac) => /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/i.test(mac);

;(async () => {
    while (true) {
        showTable(await scanNetwork(SubNet));
        
        const input = prompt('Escolha a máquina para se conectar (0 para sair): ');
        if (input == '0') break;

        var fullIP = `${SubNet}${input}`;

        if (!isIP(fullIP)) {
            console.log('Opção inexistente!');
            continue;
        } else {
            connect(fullIP);
        };
    };
})();

async function scanNetwork(subNet) {
    var sheet = parse(xlsxPath);
    
    const MAC_LIST = {};
    
    for (let row of sheet[1].data) {
        if (!row[7]) continue;
        MAC_LIST[normalize(row[7])] = row[2];
    };

    delete MAC_LIST['mac adress'];

    const { stdout } = await exec('arp -a');
    const table = [];
    const rows = stdout.split('\n');

    for (const row of rows) {
        [ ip, mac ] = row.trim().replace(/\s+/g, ' ').split(' ');

        if (!isIP(ip) || !isMAC(mac) || !ip.startsWith(subNet)) continue;

        var mac = normalize(mac);

        if (!MAC_LIST[mac]) continue;

        table.push({
            name: MAC_LIST[mac],
            ip,
            mac,
        });
    };

    return table;
};

function showTable(table) {
    for (let i in table) {
        console.log(`[${(table[i].ip).split('.')[3]}] - ${table[i].name}`);
    };
};

function connect(ip) {
    exec(`${VNCViewerPath} -host=${ip} -password=${process.env.VNC_PASSWORD} -scale=auto -encoding=tight -viewonly`);
};