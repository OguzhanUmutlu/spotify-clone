// https://github.com/transitive-bullshit/get-mp3-duration/blob/master/index.js

const versions = ['2.5', 'x', '2', '1']
const layers = ['x', '3', '2', '1']
const bitRates = {
    'V1Lx': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'V1L1': [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
    'V1L2': [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
    'V1L3': [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
    'V2Lx': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'V2L1': [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
    'V2L2': [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
    'V2L3': [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
    'VxLx': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'VxL1': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'VxL2': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'VxL3': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};
const sampleRates = {
    'x': [0, 0, 0],
    '1': [44100, 48000, 32000],
    '2': [22050, 24000, 16000],
    '2.5': [11025, 12000, 8000]
};

const samples = {
    x: {
        x: 0,
        1: 0,
        2: 0,
        3: 0
    },
    1: {
        x: 0,
        1: 384,
        2: 1152,
        3: 1152
    },
    2: {
        x: 0,
        1: 384,
        2: 1152,
        3: 576
    }
};

module.exports = (buffer) => {
    const scratch = Buffer.alloc(100);
    const bytesRead = buffer.copy(scratch, 0, 0, 100);
    if (bytesRead < 100) return 0;
    let offset = skipID3(scratch);
    let duration = 0;
    while (offset < buffer.length) {
        const bytesRead = buffer.copy(scratch, 0, offset, offset + 10);
        if (bytesRead < 10) return Math.round(duration * 1000);
        if (scratch[0] === 0xff && (scratch[1] & 0xe0) === 0xe0) {
            const header = parseFrameHeader(scratch);
            if (header.frameSize && header.samples) {
                offset += header.frameSize;
                duration += (header.samples / header.sampleRate);
            } else offset++;
        } else if (scratch[0] === 0x54 && scratch[1] === 0x41 && scratch[2] === 0x47) offset += 128;
        else offset++;
    }
    return Math.round(duration * 1000);
}

function skipID3(buffer) {
    if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
        const id3v2Flags = buffer[5];
        const footerSize = (id3v2Flags & 0x10) ? 10 : 0;
        const z0 = buffer[6];
        const z1 = buffer[7];
        const z2 = buffer[8];
        const z3 = buffer[9];
        if (((z0 & 0x80) === 0) && ((z1 & 0x80) === 0) && ((z2 & 0x80) === 0) && ((z3 & 0x80) === 0)) {
            const tagSize = ((z0 & 0x7f) * 2097152) + ((z1 & 0x7f) * 16384) + ((z2 & 0x7f) * 128) + (z3 & 0x7f);
            return 10 + tagSize + footerSize;
        }
    }
    return 0;
}

function frameSize(samples, layer, bitRate, sampleRate, paddingBit) {
    if (layer === 1) return (((samples * bitRate * 125 / sampleRate) + paddingBit * 4)) | 0;
    else return (((samples * bitRate * 125) / sampleRate) + paddingBit) | 0;
}

function parseFrameHeader(header) {
    const b1 = header[1];
    const b2 = header[2];
    const versionBits = (b1 & 0x18) >> 3;
    const version = versions[versionBits];
    const simpleVersion = (version === '2.5' ? 2 : version);
    const layerBits = (b1 & 0x06) >> 1;
    const layer = layers[layerBits];
    const bitRateKey = 'V' + simpleVersion + 'L' + layer;
    const bitRateIndex = (b2 & 0xf0) >> 4;
    const bitRate = bitRates[bitRateKey][bitRateIndex] || 0;
    const sampleRateIdx = (b2 & 0x0c) >> 2;
    const sampleRate = sampleRates[version][sampleRateIdx] || 0;
    const sample = samples[simpleVersion][layer];
    const paddingBit = (b2 & 0x02) >> 1;
    return {
        bitRate: bitRate,
        sampleRate: sampleRate,
        frameSize: frameSize(sample, layer, bitRate, sampleRate, paddingBit),
        samples: sample
    };
}

function round(duration) {
    return Math.round(duration * 1000);
}