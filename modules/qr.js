/* {"requires": ["dd","modules/dom"]} */
// $dd.qr
//		Quite a large module for creating QR codes and manuipulating
//		their display properties. Has a qr code lib injected into the
//		module. cool yeah?
;(function(factory){
	if(typeof define === 'function' && define.amd) {
		define(['../dd','./dom'], factory);
	} else {
		factory($dd);
	}
})(function(lib){
	if(lib.hasOwnProperty('qr')){
		return;
	}
	var qr_lib = (function(){
			// DI QRCode Library
			// originally done by Kazuhiko Arase
			// URL: http://www.d-project.com/
			//
			// cleaned up by me for memory footprint and
			// inhouse code standards

			//---------------------------------------------------------------------
			// QR8bitByte
			//---------------------------------------------------------------------
			function QR8bitByte(data){
				this.mode = QRMode.MODE_8BIT_BYTE;
				this.data = data;
			}
			QR8bitByte.prototype = {
				getLength : function(){
					return this.data.length;
				},	
				write : function(buffer){
					for(var i = 0; i < this.data.length; i++){
						buffer.put(this.data.charCodeAt(i), 8);
					}
				}
			};

			//---------------------------------------------------------------------
			// QRCode
			//---------------------------------------------------------------------
			function QRCode(errorCorrectLevel, data){
				this.typeNumber = 1;
				this.errorCorrectLevel = QRErrorCorrectLevel[errorCorrectLevel];
				this.modules = null;
				this.squares = [];
				this.moduleCount = 0;
				this.dataList = new Array(new QR8bitByte(data));

				var rsBlocks, buffer, totalDataCount,
					i, _data;
				for(this.typeNumber = 1; this.typeNumber < 40; this.typeNumber++){
					rsBlocks = QRRSBlock.getRSBlocks(this.typeNumber, this.errorCorrectLevel);

					buffer = new QRBitBuffer();
					totalDataCount = 0;
					for(i = 0; i < rsBlocks.length; i++){
						totalDataCount += rsBlocks[i].dataCount;
					}

					for(i = 0; i < this.dataList.length; i++){
						_data = this.dataList[i];
						buffer.put(_data.mode, 4);
						buffer.put(_data.getLength(), QRUtil.getLengthInBits(_data.mode, this.typeNumber) );
						_data.write(buffer);
					}
					if(buffer.getLengthInBits() <= totalDataCount * 8){
						break;
					}
				}

				this.makeImpl(false, this.getBestMaskPattern());
			}
			QRCode.prototype = {
				isDark : function(row, col){
					if(row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col){
						throw new Error(row + "," + col);
					}
					return this.modules[row][col];
				},
				getModuleCount : function(){
					return this.moduleCount;
				},
				makeImpl : function(test, maskPattern){
					this.moduleCount = this.typeNumber * 4 + 17;
					this.modules = new Array(this.moduleCount);

					var squares = [],
						row,col;

					for(row = 0; row < this.moduleCount; row++){
						this.modules[row] = new Array(this.moduleCount);
						for(col = 0; col < this.moduleCount; col++){
							this.modules[row][col] = null;//(col + row) % 3;
						}
					}

					squares.push(this.setupPositionProbePattern(0, 0));
					squares.push(this.setupPositionProbePattern(this.moduleCount - 7, 0));
					squares.push(this.setupPositionProbePattern(0, this.moduleCount - 7));
					squares = squares.concat(this.setupPositionAdjustPattern()||[]);
					this.setupTimingPattern();
					this.setupTypeInfo(test, maskPattern);
					
					if(this.typeNumber >= 7){
						this.setupTypeNumber(test);
					}
				
					if(this.dataCache === null){
						this.dataCache = QRCode.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
					}
				
					this.squares = test?[]:squares;
					this.mapData(this.dataCache, maskPattern);
				},
				setupPositionProbePattern : function(row, col){
					var r, c;
					for(r = -1; r <= 7; r++){
						if(row + r <= -1 || this.moduleCount <= row + r){
							continue;
						}
						
						for(c = -1; c <= 7; c++){
							if(col + c <= -1 || this.moduleCount <= col + c){
								continue;
							}
							if((0 <= r && r <= 6 && (c === 0 || c === 6)) ||
									(0 <= c && c <= 6 && (r === 0 || r === 6)) ||
									(2 <= r && r <= 4 && 2 <= c && c <= 4)){
								this.modules[row + r][col + c] = true;
							} else {
								this.modules[row + r][col + c] = false;
							}
						}		
					}
					return {
						y: row + 3.5,
						x: col + 3.5,
						type: 'probe',
						width: 7,
						height: 7
					};
				},
				getBestMaskPattern : function(){
					var minLostPoint = 0,
						pattern = 0,
						i,lostPoint;
					for(i = 0; i < 8; i++){
						this.makeImpl(true, i);

						lostPoint = QRUtil.getLostPoint(this);
				
						if(i === 0 || minLostPoint >  lostPoint){
							minLostPoint = lostPoint;
							pattern = i;
						}
					}
				
					return pattern;
				},
				setupTimingPattern : function(){
					var r,c;
					for(r = 8; r < this.moduleCount - 8; r++){
						if(this.modules[r][6] !== null){
							continue;
						}
						this.modules[r][6] = (r % 2 === 0);
					}
				
					for(c = 8; c < this.moduleCount - 8; c++){
						if(this.modules[6][c] != null){
							continue;
						}
						this.modules[6][c] = (c % 2 === 0);
					}
				},
				setupPositionAdjustPattern : function(){
					var pos = QRUtil.getPatternPosition(this.typeNumber),
						out = [],
						i,j,row,col,r,c;
					
					for(i = 0; i < pos.length; i++){
						for(j = 0; j < pos.length; j++){
							row = pos[i];
							col = pos[j];
							
							if(this.modules[row][col] != null){
								continue;
							}

							out.push({
								y: row, 
								x: col,
								type: 'alignment',
								width: 4,
								height: 4
							});

							for(r = -2; r <= 2; r++){
								for(c = -2; c <= 2; c++){
									if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)){
										this.modules[row + r][col + c] = true;
									} else {
										this.modules[row + r][col + c] = false;
									}
								}
							}
						}
					}

					return out;
				},
				setupTypeNumber : function(test){
					var bits = QRUtil.getBCHTypeNumber(this.typeNumber),
						i,mod;
				
					for(i = 0; i < 18; i++){
						mod = (!test && ( (bits >> i) & 1) === 1);
						this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
					}
					for(i = 0; i < 18; i++){
						mod = (!test && ( (bits >> i) & 1) === 1);
						this.modules[i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
					}
				},
				setupTypeInfo : function(test, maskPattern){
					var data = (this.errorCorrectLevel << 3) | maskPattern,
						bits = QRUtil.getBCHTypeInfo(data),
						i,mod;
				
					// vertical		
					for(i = 0; i < 15; i++){
						mod = (!test && ( (bits >> i) & 1) === 1);
				
						if(i < 6){
							this.modules[i][8] = mod;
						} else if (i < 8){
							this.modules[i + 1][8] = mod;
						} else {
							this.modules[this.moduleCount - 15 + i][8] = mod;
						}
					}
				
					// horizontal
					for(i = 0; i < 15; i++){
						mod = (!test && ( (bits >> i) & 1) === 1);
						
						if (i < 8){
							this.modules[8][this.moduleCount - i - 1] = mod;
						} else if (i < 9){
							this.modules[8][15 - i - 1 + 1] = mod;
						} else {
							this.modules[8][15 - i - 1] = mod;
						}
					}
				
					// fixed module
					this.modules[this.moduleCount - 8][8] = (!test);
				},
				mapData : function(data, maskPattern){
					var inc = -1,
						row = this.moduleCount - 1,
						bitIndex = 7,
						byteIndex = 0,
						col,c,dark;
					
					for(col = this.moduleCount - 1; col > 0; col -= 2){
						if (col === 6){
							col--;
						}
				
						while(true){
							for(c = 0; c < 2; c++){
								if(this.modules[row][col - c] !== null){
									continue;
								}
								dark = false;

								if(byteIndex < data.length){
									dark = ( ( (data[byteIndex] >>> bitIndex) & 1) === 1);
								}

								if(QRUtil.getMask(maskPattern, row, col - c)){
									dark = !dark;
								}
								
								this.modules[row][col - c] = dark;
								bitIndex--;

								if(bitIndex === -1){
									byteIndex++;
									bitIndex = 7;
								}
							}
											
							row += inc;
				
							if(row < 0 || this.moduleCount <= row){
								row -= inc;
								inc = -inc;
								break;
							}
						}
					}
					var mc = this.modules.length,
						ni,na, no,
						sr,er,
						sc,ec;
					function clamp(d){
						return Math.max(0,Math.min(d,mc-1));
					}

					for(ni = 0; ni < this.squares.length;ni++){
						sr = clamp(this.squares[ni].y - this.squares[ni].width/2);
						er = clamp(this.squares[ni].y + this.squares[ni].width/2);
						sc = clamp(this.squares[ni].x - this.squares[ni].height/2);
						ec = clamp(this.squares[ni].x + this.squares[ni].height/2);

						for(no = sr; no <= er; no++){
							for(na = sc; na <= ec; na++){
								this.modules[no][na] = false;
							}
						}
					}
				}
			};

			QRCode.createData = function(typeNumber, errorCorrectLevel, dataList){
				var PAD0 = 0xEC,
					PAD1 = 0x11,
					rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel),
					buffer = new QRBitBuffer(),
					totalDataCount = 0,
					i,data;
				
				for(i = 0; i < dataList.length; i++){
					data = dataList[i];
					buffer.put(data.mode, 4);
					buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber) );
					data.write(buffer);
				}

				// calc num max data.
				for(i = 0; i < rsBlocks.length; i++){
					totalDataCount += rsBlocks[i].dataCount;
				}

				if(buffer.getLengthInBits() > totalDataCount * 8){
					throw new Error("code length overflow. (" +
						buffer.getLengthInBits() +
						">" +
						(totalDataCount * 8) +
						")");
				}

				// end code
				if(buffer.getLengthInBits() + 4 <= totalDataCount * 8){
					buffer.put(0, 4);
				}

				// padding
				while(buffer.getLengthInBits() % 8 !== 0){
					buffer.putBit(false);
				}

				// padding
				while(true){
					if(buffer.getLengthInBits() >= totalDataCount * 8){
						break;
					}
					buffer.put(PAD0, 8);
					
					if(buffer.getLengthInBits() >= totalDataCount * 8){
						break;
					}
					buffer.put(PAD1, 8);
				}

				return QRCode.createBytes(buffer, rsBlocks);
			};
			QRCode.createBytes = function(buffer, rsBlocks){
				var offset = 0,
					maxDcCount = 0,
					maxEcCount = 0,
					dcdata = new Array(rsBlocks.length),
					ecdata = new Array(rsBlocks.length),
					r,dcCount,ecCount,i,rsPoly,rawPoly,modPoly,modIndex,
					totalCodeCount,data,index;
				
				for(r = 0; r < rsBlocks.length; r++){
					dcCount = rsBlocks[r].dataCount;
					ecCount = rsBlocks[r].totalCount - dcCount;

					maxDcCount = Math.max(maxDcCount, dcCount);
					maxEcCount = Math.max(maxEcCount, ecCount);
					
					dcdata[r] = new Array(dcCount);
					
					for(i = 0; i < dcdata[r].length; i++){
						dcdata[r][i] = 0xff & buffer.buffer[i + offset];
					}
					offset += dcCount;
					
					rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
					rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);

					modPoly = rawPoly.mod(rsPoly);
					ecdata[r] = new Array(rsPoly.getLength() - 1);
					for(i = 0; i < ecdata[r].length; i++){
			            modIndex = i + modPoly.getLength() - ecdata[r].length;
						ecdata[r][i] = (modIndex >= 0)? modPoly.get(modIndex) : 0;
					}
				}
				
				totalCodeCount = 0;
				for(i = 0; i < rsBlocks.length; i++){
					totalCodeCount += rsBlocks[i].totalCount;
				}

				data = new Array(totalCodeCount);
				index = 0;

				for(i = 0; i < maxDcCount; i++){
					for(r = 0; r < rsBlocks.length; r++){
						if(i < dcdata[r].length){
							data[index++] = dcdata[r][i];
						}
					}
				}

				for(i = 0; i < maxEcCount; i++){
					for(r = 0; r < rsBlocks.length; r++){
						if(i < ecdata[r].length){
							data[index++] = ecdata[r][i];
						}
					}
				}

				return data;
			};

			//---------------------------------------------------------------------
			// QRMode
			//---------------------------------------------------------------------
			var QRMode = {
				MODE_NUMBER :		1 << 0,
				MODE_ALPHA_NUM : 	1 << 1,
				MODE_8BIT_BYTE : 	1 << 2,
				MODE_KANJI :		1 << 3
			};

			//---------------------------------------------------------------------
			// QRErrorCorrectLevel
			//---------------------------------------------------------------------
			var QRErrorCorrectLevel = {
				L : 1,
				M : 0,
				Q : 3,
				H : 2
			};

			//---------------------------------------------------------------------
			// QRMaskPattern
			//---------------------------------------------------------------------
			var QRMaskPattern = {
				PATTERN000 : 0,
				PATTERN001 : 1,
				PATTERN010 : 2,
				PATTERN011 : 3,
				PATTERN100 : 4,
				PATTERN101 : 5,
				PATTERN110 : 6,
				PATTERN111 : 7
			};

			//---------------------------------------------------------------------
			// QRUtil
			//--------------------------------------------------------------------- 
			var QRUtil = {
			    PATTERN_POSITION_TABLE : [
				    [],
				    [6, 18],
				    [6, 22],
				    [6, 26],
				    [6, 30],
				    [6, 34],
				    [6, 22, 38],
				    [6, 24, 42],
				    [6, 26, 46],
				    [6, 28, 50],
				    [6, 30, 54],		
				    [6, 32, 58],
				    [6, 34, 62],
				    [6, 26, 46, 66],
				    [6, 26, 48, 70],
				    [6, 26, 50, 74],
				    [6, 30, 54, 78],
				    [6, 30, 56, 82],
				    [6, 30, 58, 86],
				    [6, 34, 62, 90],
				    [6, 28, 50, 72, 94],
				    [6, 26, 50, 74, 98],
				    [6, 30, 54, 78, 102],
				    [6, 28, 54, 80, 106],
				    [6, 32, 58, 84, 110],
				    [6, 30, 58, 86, 114],
				    [6, 34, 62, 90, 118],
				    [6, 26, 50, 74, 98, 122],
				    [6, 30, 54, 78, 102, 126],
				    [6, 26, 52, 78, 104, 130],
				    [6, 30, 56, 82, 108, 134],
				    [6, 34, 60, 86, 112, 138],
				    [6, 30, 58, 86, 114, 142],
				    [6, 34, 62, 90, 118, 146],
				    [6, 30, 54, 78, 102, 126, 150],
				    [6, 24, 50, 76, 102, 128, 154],
				    [6, 28, 54, 80, 106, 132, 158],
				    [6, 32, 58, 84, 110, 136, 162],
				    [6, 26, 54, 82, 110, 138, 166],
				    [6, 30, 58, 86, 114, 142, 170]
			    ],

			    G15 : (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
			    G18 : (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
			    G15_MASK : (1 << 14) | (1 << 12) | (1 << 10)	| (1 << 4) | (1 << 1),

			    getBCHTypeInfo : function(data) {
				    var d = data << 10;
				    while(QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0){
					    d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) ) ); 	
				    }
				    return ( (data << 10) | d) ^ QRUtil.G15_MASK;
			    },
			    getBCHTypeNumber : function(data) {
				    var d = data << 12;
				    while(QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0){
					    d ^= (QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) ) ); 	
				    }
				    return (data << 12) | d;
			    },
			    getBCHDigit : function(data) {
				    var digit = 0;

				    while (data !== 0){
					    digit++;
					    data >>>= 1;
				    }

				    return digit;
			    },
			    getPatternPosition : function(typeNumber) {
				    return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
			    },
			    getMask : function(maskPattern, i, j){
				    switch (maskPattern) {
					    case QRMaskPattern.PATTERN000 : return (i + j) % 2 === 0;
					    case QRMaskPattern.PATTERN001 : return i % 2 === 0;
					    case QRMaskPattern.PATTERN010 : return j % 3 === 0;
					    case QRMaskPattern.PATTERN011 : return (i + j) % 3 === 0;
					    case QRMaskPattern.PATTERN100 : return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 === 0;
					    case QRMaskPattern.PATTERN101 : return (i * j) % 2 + (i * j) % 3 === 0;
					    case QRMaskPattern.PATTERN110 : return ( (i * j) % 2 + (i * j) % 3) % 2 === 0;
					    case QRMaskPattern.PATTERN111 : return ( (i * j) % 3 + (i + j) % 2) % 2 === 0;
					    default :
						    throw new Error("bad maskPattern:" + maskPattern);
				    }
			    },

			    getErrorCorrectPolynomial : function(errorCorrectLength){
				    var a = new QRPolynomial([1], 0),
				    	i;

				    for(i = 0; i < errorCorrectLength; i++){
					    a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0) );
				    }

				    return a;
			    },
			    getLengthInBits : function(mode, type){
				    if (1 <= type && type < 10){
					    switch(mode) {
						    case QRMode.MODE_NUMBER 	: return 10;
						    case QRMode.MODE_ALPHA_NUM 	: return 9;
						    case QRMode.MODE_8BIT_BYTE	: return 8;
						    case QRMode.MODE_KANJI  	: return 8;
						    default :
							    throw new Error("mode:" + mode);
					    }
				    } else if (type < 27) {
					    switch(mode) {
						    case QRMode.MODE_NUMBER 	: return 12;
						    case QRMode.MODE_ALPHA_NUM 	: return 11;
						    case QRMode.MODE_8BIT_BYTE	: return 16;
						    case QRMode.MODE_KANJI  	: return 10;
						    default :
							    throw new Error("mode:" + mode);
					    }
				    } else if (type < 41) {
					    switch(mode) {
						    case QRMode.MODE_NUMBER 	: return 14;
						    case QRMode.MODE_ALPHA_NUM	: return 13;
						    case QRMode.MODE_8BIT_BYTE	: return 16;
						    case QRMode.MODE_KANJI  	: return 12;
						    default :
							    throw new Error("mode:" + mode);
					    }
				    } else {
					    throw new Error("type:" + type);
				    }
			    },
			    getLostPoint : function(qrCode){
				    var moduleCount = qrCode.getModuleCount(),
				    	lostPoint = 0,
				    	row,col,
				    	sameCount,dark,
				    	r,c,
				    	count,darkCount;

				    // LEVEL1
				    for(row = 0; row < moduleCount; row++){
					    for (col = 0; col < moduleCount; col++) {
						    sameCount = 0;
						    dark = qrCode.isDark(row, col);

							for (r = -1; r <= 1; r++){
							    if (row + r < 0 || moduleCount <= row + r){
								    continue;
							    }

							    for (c = -1; c <= 1; c++){
								    if (col + c < 0 || moduleCount <= col + c){
									    continue;
								    }

								    if (r === 0 && c === 0){
									    continue;
								    }

								    if (dark === qrCode.isDark(row + r, col + c) ){
									    sameCount++;
								    }
							    }
						    }

						    if(sameCount > 5){
							    lostPoint += (3 + sameCount - 5);
						    }
					    }
				    }

				    // LEVEL2
				    for(row = 0; row < moduleCount - 1; row++){
					    for(col = 0; col < moduleCount - 1; col++){
						    count = 0;
						    if(qrCode.isDark(row,col)){
						    	count++;
						    }
						    if(qrCode.isDark(row + 1, col)){
						    	count++;
						    }
						    if(qrCode.isDark(row, col + 1)){
						    	count++;
						    }
						    if(qrCode.isDark(row + 1, col + 1)){
						    	count++;
						    }
						    if(count === 0 || count === 4){
							    lostPoint += 3;
						    }
					    }
				    }

				    // LEVEL3
				    for(row = 0; row < moduleCount; row++){
					    for(col = 0; col < moduleCount - 6; col++){
						    if (qrCode.isDark(row, col) &&
								    !qrCode.isDark(row, col + 1) &&
								     qrCode.isDark(row, col + 2) &&
								     qrCode.isDark(row, col + 3) &&
								     qrCode.isDark(row, col + 4) &&
								    !qrCode.isDark(row, col + 5) &&
								     qrCode.isDark(row, col + 6)){
							    lostPoint += 40;
							}
					    }
				    }

				    for(col = 0; col < moduleCount; col++){
					    for(row = 0; row < moduleCount - 6; row++){
						    if(qrCode.isDark(row, col) &&
								    !qrCode.isDark(row + 1, col) &&
								     qrCode.isDark(row + 2, col) &&
								     qrCode.isDark(row + 3, col) &&
								     qrCode.isDark(row + 4, col) &&
								    !qrCode.isDark(row + 5, col) &&
								     qrCode.isDark(row + 6, col)){
							    lostPoint += 40;
							}
					    }
				    }

				    // LEVEL4
				    darkCount = 0;
				    for(col = 0; col < moduleCount; col++){
					    for(row = 0; row < moduleCount; row++){
						    if(qrCode.isDark(row, col)){
							    darkCount++;
						    }
					    }
				    }
				    
				    lostPoint += (Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5) * 10;

				    return lostPoint;		
			    }
			};

			//---------------------------------------------------------------------
			// QRMath
			//---------------------------------------------------------------------
			var QRMath = (function(){
				var exp = new Array(256),
					log = new Array(256),
					i;

				for(i = 0; i < 8; i++){
					exp[i] = 1 << i;
				}
				for(i = 8; i < 256; i++){
					exp[i] = exp[i - 4] ^ exp[i - 5] ^ exp[i - 6] ^ exp[i - 8];
				}
				for(i = 0; i < 255; i++){
					log[exp[i]] = i;
				}

				return {
					glog : function(n) {
						if (n < 1){
							throw new Error("glog(" + n + ")");
						}
						
						return QRMath.LOG_TABLE[n];
					},
					gexp : function(n) {
						while (n < 0){
							n += 255;
						}
						while (n >= 256){
							n -= 255;
						}
					
						return QRMath.EXP_TABLE[n];
					},
					
					EXP_TABLE : exp,
					LOG_TABLE : log
				};
			})();

			//---------------------------------------------------------------------
			// QRPolynomial
			//---------------------------------------------------------------------
			function QRPolynomial(num, shift){
				if (num.length === undefined){
					throw new Error(num.length + "/" + shift);
				}

				var offset = 0, i;

				while(offset < num.length && num[offset] === 0){
					offset++;
				}

				this.num = new Array(num.length - offset + shift);
				for(i = 0; i < num.length - offset; i++){
					this.num[i] = num[i + offset];
				}
			}
			QRPolynomial.prototype = {
				get : function(index) {
					return this.num[index];
				},
				getLength : function() {
					return this.num.length;
				},
				multiply : function(e){
					var num = new Array(this.getLength() + e.getLength() - 1),
						i,j;
				
					for(i = 0; i < this.getLength(); i++) {
						for(j = 0; j < e.getLength(); j++) {
							num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i) ) + QRMath.glog(e.get(j) ) );
						}
					}
				
					return new QRPolynomial(num, 0);
				},
				mod : function(e) {
					if (this.getLength() - e.getLength() < 0){
						return this;
					}
				
					var ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0)),
						num = new Array(this.getLength()),
						i;
					
					for(i = 0; i < this.getLength(); i++){
						num[i] = this.get(i);
					}
					for(i = 0; i < e.getLength(); i++){
						num[i] ^= QRMath.gexp(QRMath.glog(e.get(i) ) + ratio);
					}
				
					// recursive call
					return new QRPolynomial(num, 0).mod(e);
				}
			};

			//---------------------------------------------------------------------
			// QRRSBlock
			//---------------------------------------------------------------------
			function QRRSBlock(totalCount, dataCount) {
				this.totalCount = totalCount;
				this.dataCount  = dataCount;
			}
			QRRSBlock.RS_BLOCK_TABLE = [

				// L
				// M
				// Q
				// H

				// 1
				[1, 26, 19],
				[1, 26, 16],
				[1, 26, 13],
				[1, 26, 9],
				
				// 2
				[1, 44, 34],
				[1, 44, 28],
				[1, 44, 22],
				[1, 44, 16],

				// 3
				[1, 70, 55],
				[1, 70, 44],
				[2, 35, 17],
				[2, 35, 13],

				// 4		
				[1, 100, 80],
				[2, 50, 32],
				[2, 50, 24],
				[4, 25, 9],
				
				// 5
				[1, 134, 108],
				[2, 67, 43],
				[2, 33, 15, 2, 34, 16],
				[2, 33, 11, 2, 34, 12],
				
				// 6
				[2, 86, 68],
				[4, 43, 27],
				[4, 43, 19],
				[4, 43, 15],
				
				// 7		
				[2, 98, 78],
				[4, 49, 31],
				[2, 32, 14, 4, 33, 15],
				[4, 39, 13, 1, 40, 14],
				
				// 8
				[2, 121, 97],
				[2, 60, 38, 2, 61, 39],
				[4, 40, 18, 2, 41, 19],
				[4, 40, 14, 2, 41, 15],
				
				// 9
				[2, 146, 116],
				[3, 58, 36, 2, 59, 37],
				[4, 36, 16, 4, 37, 17],
				[4, 36, 12, 4, 37, 13],
				
				// 10		
				[2, 86, 68, 2, 87, 69],
				[4, 69, 43, 1, 70, 44],
				[6, 43, 19, 2, 44, 20],
				[6, 43, 15, 2, 44, 16],

				// 11
				[4, 101, 81],
				[1, 80, 50, 4, 81, 51],
				[4, 50, 22, 4, 51, 23],
				[3, 36, 12, 8, 37, 13],

				// 12
				[2, 116, 92, 2, 117, 93],
				[6, 58, 36, 2, 59, 37],
				[4, 46, 20, 6, 47, 21],
				[7, 42, 14, 4, 43, 15],

				// 13
				[4, 133, 107],
				[8, 59, 37, 1, 60, 38],
				[8, 44, 20, 4, 45, 21],
				[12, 33, 11, 4, 34, 12],

				// 14
				[3, 145, 115, 1, 146, 116],
				[4, 64, 40, 5, 65, 41],
				[11, 36, 16, 5, 37, 17],
				[11, 36, 12, 5, 37, 13],

				// 15
				[5, 109, 87, 1, 110, 88],
				[5, 65, 41, 5, 66, 42],
				[5, 54, 24, 7, 55, 25],
				[11, 36, 12],

				// 16
				[5, 122, 98, 1, 123, 99],
				[7, 73, 45, 3, 74, 46],
				[15, 43, 19, 2, 44, 20],
				[3, 45, 15, 13, 46, 16],

				// 17
				[1, 135, 107, 5, 136, 108],
				[10, 74, 46, 1, 75, 47],
				[1, 50, 22, 15, 51, 23],
				[2, 42, 14, 17, 43, 15],

				// 18
				[5, 150, 120, 1, 151, 121],
				[9, 69, 43, 4, 70, 44],
				[17, 50, 22, 1, 51, 23],
				[2, 42, 14, 19, 43, 15],

				// 19
				[3, 141, 113, 4, 142, 114],
				[3, 70, 44, 11, 71, 45],
				[17, 47, 21, 4, 48, 22],
				[9, 39, 13, 16, 40, 14],

				// 20
				[3, 135, 107, 5, 136, 108],
				[3, 67, 41, 13, 68, 42],
				[15, 54, 24, 5, 55, 25],
				[15, 43, 15, 10, 44, 16],

				// 21
				[4, 144, 116, 4, 145, 117],
				[17, 68, 42],
				[17, 50, 22, 6, 51, 23],
				[19, 46, 16, 6, 47, 17],

				// 22
				[2, 139, 111, 7, 140, 112],
				[17, 74, 46],
				[7, 54, 24, 16, 55, 25],
				[34, 37, 13],

				// 23
				[4, 151, 121, 5, 152, 122],
				[4, 75, 47, 14, 76, 48],
				[11, 54, 24, 14, 55, 25],
				[16, 45, 15, 14, 46, 16],

				// 24
				[6, 147, 117, 4, 148, 118],
				[6, 73, 45, 14, 74, 46],
				[11, 54, 24, 16, 55, 25],
				[30, 46, 16, 2, 47, 17],

				// 25
				[8, 132, 106, 4, 133, 107],
				[8, 75, 47, 13, 76, 48],
				[7, 54, 24, 22, 55, 25],
				[22, 45, 15, 13, 46, 16],

				// 26
				[10, 142, 114, 2, 143, 115],
				[19, 74, 46, 4, 75, 47],
				[28, 50, 22, 6, 51, 23],
				[33, 46, 16, 4, 47, 17],

				// 27
				[8, 152, 122, 4, 153, 123],
				[22, 73, 45, 3, 74, 46],
				[8, 53, 23, 26, 54, 24],
				[12, 45, 15, 28, 46, 16],

				// 28
				[3, 147, 117, 10, 148, 118],
				[3, 73, 45, 23, 74, 46],
				[4, 54, 24, 31, 55, 25],
				[11, 45, 15, 31, 46, 16],

				// 29
				[7, 146, 116, 7, 147, 117],
				[21, 73, 45, 7, 74, 46],
				[1, 53, 23, 37, 54, 24],
				[19, 45, 15, 26, 46, 16],

				// 30
				[5, 145, 115, 10, 146, 116],
				[19, 75, 47, 10, 76, 48],
				[15, 54, 24, 25, 55, 25],
				[23, 45, 15, 25, 46, 16],

				// 31
				[13, 145, 115, 3, 146, 116],
				[2, 74, 46, 29, 75, 47],
				[42, 54, 24, 1, 55, 25],
				[23, 45, 15, 28, 46, 16],

				// 32
				[17, 145, 115],
				[10, 74, 46, 23, 75, 47],
				[10, 54, 24, 35, 55, 25],
				[19, 45, 15, 35, 46, 16],

				// 33
				[17, 145, 115, 1, 146, 116],
				[14, 74, 46, 21, 75, 47],
				[29, 54, 24, 19, 55, 25],
				[11, 45, 15, 46, 46, 16],

				// 34
				[13, 145, 115, 6, 146, 116],
				[14, 74, 46, 23, 75, 47],
				[44, 54, 24, 7, 55, 25],
				[59, 46, 16, 1, 47, 17],

				// 35
				[12, 151, 121, 7, 152, 122],
				[12, 75, 47, 26, 76, 48],
				[39, 54, 24, 14, 55, 25],
				[22, 45, 15, 41, 46, 16],

				// 36
				[6, 151, 121, 14, 152, 122],
				[6, 75, 47, 34, 76, 48],
				[46, 54, 24, 10, 55, 25],
				[2, 45, 15, 64, 46, 16],

				// 37
				[17, 152, 122, 4, 153, 123],
				[29, 74, 46, 14, 75, 47],
				[49, 54, 24, 10, 55, 25],
				[24, 45, 15, 46, 46, 16],

				// 38
				[4, 152, 122, 18, 153, 123],
				[13, 74, 46, 32, 75, 47],
				[48, 54, 24, 14, 55, 25],
				[42, 45, 15, 32, 46, 16],

				// 39
				[20, 147, 117, 4, 148, 118],
				[40, 75, 47, 7, 76, 48],
				[43, 54, 24, 22, 55, 25],
				[10, 45, 15, 67, 46, 16],

				// 40
				[19, 148, 118, 6, 149, 119],
				[18, 75, 47, 31, 76, 48],
				[34, 54, 24, 34, 55, 25],
				[20, 45, 15, 61, 46, 16]
			];
			QRRSBlock.getRSBlocks = function(typeNumber, errorCorrectLevel){
				var rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
				
				if(rsBlock === undefined){
					throw new Error("bad rs block @ typeNumber:" + typeNumber + "/errorCorrectLevel:" + errorCorrectLevel);
				}

				var length = rsBlock.length / 3,
					list = [],
					i, j, count, totalCount, dataCount;
				for(i = 0; i < length; i++){
					count = rsBlock[i * 3 + 0];
					totalCount = rsBlock[i * 3 + 1];
					dataCount  = rsBlock[i * 3 + 2];

					for(j = 0; j < count; j++){
						list.push(new QRRSBlock(totalCount, dataCount) );
					}
				}
				
				return list;
			};
			QRRSBlock.getRsBlockTable = function(typeNumber, errorCorrectLevel) {
				switch(errorCorrectLevel) {
					case QRErrorCorrectLevel.L :
						return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
					case QRErrorCorrectLevel.M :
						return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
					case QRErrorCorrectLevel.Q :
						return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
					case QRErrorCorrectLevel.H :
						return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
					default :
						return undefined;
				}
			};

			//---------------------------------------------------------------------
			// QRBitBuffer
			//---------------------------------------------------------------------
			function QRBitBuffer() {
				this.buffer = [];
				this.length = 0;
			}
			QRBitBuffer.prototype = {
				get : function(index) {
					var bufIndex = Math.floor(index / 8);
					return ( (this.buffer[bufIndex] >>> (7 - index % 8) ) & 1) === 1;
				},
				put : function(num, length) {
					for(var i = 0; i < length; i++){
						this.putBit( ( (num >>> (length - i - 1) ) & 1) === 1);
					}
				},
				getLengthInBits : function() {
					return this.length;
				},
				
				putBit : function(bit) {
					var bufIndex = Math.floor(this.length / 8);
					if (this.buffer.length <= bufIndex){
						this.buffer.push(0);
					}
				
					if (bit){
						this.buffer[bufIndex] |= (0x80 >>> (this.length % 8) );
					}
				
					this.length++;
				}
			};

			return QRCode;
		})();

	var corners = {
		'standard': function(code,ctx,square,scale){
			if(square.type === 'probe'){
				ctx.strokeStyle = code.probe.outerColor;
				ctx.lineWidth = scale;
				ctx.beginPath();
				ctx.rect(
					(square.x-(square.width - 1)/2) * scale,
					(square.y-(square.height - 1)/2) * scale,
					(square.width-1)*scale,
					(square.height-1)*scale);
				ctx.stroke();

				ctx.fillStyle = code.probe.innerColor;
				ctx.beginPath();
				ctx.rect(
					(square.x-3/2) * scale,
					(square.y-3/2) * scale,
					3*scale,
					3*scale);
				ctx.fill();
			} else {
				ctx.strokeStyle = code.alignment.outerColor;
				ctx.lineWidth = scale;
				ctx.beginPath();
				ctx.rect(
					(square.x-(square.width - 1)/2) * scale,
					(square.y-(square.height - 1)/2) * scale,
					square.width*scale,
					square.height*scale);
				ctx.stroke();

				ctx.fillStyle = code.alignment.innerColor;
				ctx.beginPath();
				ctx.rect(
					(square.x + 0.5 - 1.25/2) * scale,
					(square.y + 0.5 - 1.25/2) * scale,
					1.25*scale,
					1.25*scale
				);
				ctx.fill();
			}
		},
		'round': function(code,ctx,square,scale){
			var br, w;
			if(square.type === 'probe'){
				br = 1.5 * scale;
				ctx.strokeStyle = code.probe.outerColor;
				ctx.lineWidth = scale;
				ctx.beginPath();
				ctx.moveTo((square.x - (square.width - 1)/2)*scale + br,(square.y - (square.height - 1)/2)*scale);
				ctx.lineTo((square.x + (square.width - 1)/2)*scale - br,(square.y - (square.height - 1)/2)*scale);
				ctx.arc((square.x + (square.width - 1)/2)*scale - br,(square.y - (square.height - 1)/2)*scale+br,br,-Math.PI/2,0,false);
				ctx.lineTo((square.x + (square.width - 1)/2)*scale,(square.y + (square.height - 1)/2)*scale - br);
				ctx.arc((square.x + (square.width - 1)/2)*scale - br,(square.y + (square.height - 1)/2)*scale-br,br,0,Math.PI/2,false);
				ctx.lineTo((square.x - (square.width - 1)/2)*scale + br,(square.y + (square.height - 1)/2)*scale);
				ctx.arc((square.x - (square.width - 1)/2)*scale + br,(square.y + (square.height - 1)/2)*scale-br,br,Math.PI/2,Math.PI,false);
				ctx.lineTo((square.x - (square.width - 1)/2)*scale,(square.y - (square.height - 1)/2)*scale+br);
				ctx.arc((square.x - (square.width - 1)/2)*scale + br,(square.y - (square.height - 1)/2)*scale+br,br,Math.PI,Math.PI*3/2,false);
				ctx.stroke();

				w = 4;
				br = 0.75 * scale;

				ctx.fillStyle = code.probe.innerColor;
				ctx.beginPath();
				ctx.moveTo((square.x - (3 - 1)/2)*scale + br,(square.y - (w - 1)/2)*scale);
				ctx.lineTo((square.x + (w - 1)/2)*scale - br,(square.y - (w - 1)/2)*scale);
				ctx.arc((square.x + (w - 1)/2)*scale - br,(square.y - (w - 1)/2)*scale+br,br,-Math.PI/2,0,false);
				ctx.lineTo((square.x + (w - 1)/2)*scale,(square.y + (w - 1)/2)*scale - br);
				ctx.arc((square.x + (w - 1)/2)*scale - br,(square.y + (w - 1)/2)*scale-br,br,0,Math.PI/2,false);
				ctx.lineTo((square.x - (w - 1)/2)*scale + br,(square.y + (w - 1)/2)*scale);
				ctx.arc((square.x - (w - 1)/2)*scale + br,(square.y + (w - 1)/2)*scale-br,br,Math.PI/2,Math.PI,false);
				ctx.lineTo((square.x - (w - 1)/2)*scale,(square.y - (w - 1)/2)*scale+br);
				ctx.arc((square.x - (w - 1)/2)*scale + br,(square.y - (w - 1)/2)*scale+br,br,Math.PI,Math.PI*3/2,false);
				ctx.fill();
			} else {
				var x = square.x + 0.5,
					y = square.y + 0.5,
					h = square.height + 0.25,
					lw = 0.75;

				br = 1 * scale;
				w = square.width + 0.25;

				ctx.strokeStyle = code.alignment.outerColor;
				ctx.lineWidth = lw*scale;
				ctx.beginPath();
				ctx.moveTo((x - (w - lw)/2)*scale + br,(y - (h - lw)/2)*scale);
				ctx.lineTo((x + (w - lw)/2)*scale - br,(y - (h - lw)/2)*scale);
				ctx.arc((x + (w - lw)/2)*scale - br,(y - (h - lw)/2)*scale+br,br,-Math.PI/2,0,false);
				ctx.lineTo((x + (w - lw)/2)*scale,(y + (h - lw)/2)*scale - br);
				ctx.arc((x + (w - lw)/2)*scale - br,(y + (h - lw)/2)*scale-br,br,0,Math.PI/2,false);
				ctx.lineTo((x - (w - lw)/2)*scale + br,(y + (h - lw)/2)*scale);
				ctx.arc((x - (w - lw)/2)*scale + br,(y + (h - lw)/2)*scale-br,br,Math.PI/2,Math.PI,false);
				ctx.lineTo((x - (w - lw)/2)*scale,(y - (h - lw)/2)*scale+br);
				ctx.arc((x - (w - lw)/2)*scale + br,(y - (h - lw)/2)*scale+br,br,Math.PI,Math.PI*3/2,false);
				ctx.stroke();

				br = 0.5 * scale;
				x = square.x + 0.5;
				y = square.y + 0.5;
				w = 2;
				h = 2;

				ctx.fillStyle = code.alignment.innerColor;
				ctx.lineWidth = lw*scale;
				ctx.beginPath();
				ctx.moveTo((x - (w - lw)/2)*scale + br,(y - (h - lw)/2)*scale);
				ctx.lineTo((x + (w - lw)/2)*scale - br,(y - (h - lw)/2)*scale);
				ctx.arc((x + (w - lw)/2)*scale - br,(y - (h - lw)/2)*scale+br,br,-Math.PI/2,0,false);
				ctx.lineTo((x + (w - lw)/2)*scale,(y + (h - lw)/2)*scale - br);
				ctx.arc((x + (w - lw)/2)*scale - br,(y + (h - lw)/2)*scale-br,br,0,Math.PI/2,false);
				ctx.lineTo((x - (w - lw)/2)*scale + br,(y + (h - lw)/2)*scale);
				ctx.arc((x - (w - lw)/2)*scale + br,(y + (h - lw)/2)*scale-br,br,Math.PI/2,Math.PI,false);
				ctx.lineTo((x - (w - lw)/2)*scale,(y - (h - lw)/2)*scale+br);
				ctx.arc((x - (w - lw)/2)*scale + br,(y - (h - lw)/2)*scale+br,br,Math.PI,Math.PI*3/2,false);
				ctx.fill();
			}
		},
		'ronds': function(){},
		'feuille': function(){}
	},
	dots = {
		'standard': function(code,ctx,center,scale){
			ctx.fillStyle = code.dot.color;
			ctx.beginPath();
			ctx.rect(center.x*scale,center.y*scale,scale+1,scale+1);
			ctx.fill();
		},
		'round': function(code,ctx,center,scale){
			ctx.fillStyle = code.dot.color;
			ctx.beginPath();
			ctx.arc((center.x+0.5)*scale,(center.y+0.5)*scale,scale*0.55,0,2*Math.PI,false);
			ctx.fill();
		}
	};

	lib.mixin({
		qr: function(options){
			var StyleObj = function(data){
				return lib.model({
					style: 'standard',
					innerColor: '#000',
					outerColor: '#000'
				}).fill(data);
			};
			var DotStyleObj = function(data){
				return lib.model({
					style: 'standard',
					color: '#000'
				}).fill(data);
			};
			var self = lib.model({
				element: null,
				correction: 'M',
				text: '',
				probe: StyleObj(),
				alignment: StyleObj(),
				dot: DotStyleObj()
			}).type({
				probe: StyleObj,
				alignment: StyleObj,
				dot: DotStyleObj
			}).pre(function(_data){
				if(_data.text|| _data.correction){
					self.code = new qr_lib(self.correction,self.text);
				}
				lib.init(function(){
					if(!self.element){
						return;
					}
					self.element = lib.dom(self.element);
					self.draw(self.element);
				});
			},1);

			self.code = null;

			self.draw = function(){
				var dim = self.element.measure(),
					mc = self.code.modules.length,
					c = document.createElement('canvas'),
					ctx = c.getContext('2d'),
					scale = dim.innerWidth/mc,
					ni,no;
				c.width = c.height = dim.innerWidth;
				for(ni = 0; ni < mc; ni++){
					for(no = 0; no < mc; no++){
						if(self.code.isDark(ni,no)){
							dots[self.dot.style](self,ctx,{ x: no, y: ni },scale);
						}
					}
				}
				for(ni = 0; ni < self.code.squares.length; ni++){
					corners[self[self.code.squares[ni].type].style](self,ctx,self.code.squares[ni],scale);
				}

				self.element[0].src = c.toDataURL();
			};

			return self.fill(options);
		}
	});
});