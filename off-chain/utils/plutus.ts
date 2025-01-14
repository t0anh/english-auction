import type { Validator } from '@lucid-evolution/lucid';

export interface AuctionContract {
  new (): Validator;
  datum: {
    sellerAddr: {
      paymentCredential:
        | { VerificationKeyCredential: [string] }
        | {
            ScriptCredential: [string];
          };
      stakeCredential:
        | {
            Inline: [
              | { VerificationKeyCredential: [string] }
              | {
                  ScriptCredential: [string];
                }
            ];
          }
        | {
            Pointer: {
              slotNumber: bigint;
              transactionIndex: bigint;
              certificateIndex: bigint;
            };
          }
        | null;
    };
    lastBid:
      | [
          {
            paymentCredential:
              | { VerificationKeyCredential: [string] }
              | {
                  ScriptCredential: [string];
                };
            stakeCredential:
              | {
                  Inline: [
                    | { VerificationKeyCredential: [string] }
                    | {
                        ScriptCredential: [string];
                      }
                  ];
                }
              | {
                  Pointer: {
                    slotNumber: bigint;
                    transactionIndex: bigint;
                    certificateIndex: bigint;
                  };
                }
              | null;
          },
          bigint
        ]
      | null;
    deadline: bigint;
    reservePrice: bigint;
  };
  redeemer:
    | {
        Bid: [
          {
            paymentCredential:
              | { VerificationKeyCredential: [string] }
              | {
                  ScriptCredential: [string];
                };
            stakeCredential:
              | {
                  Inline: [
                    | { VerificationKeyCredential: [string] }
                    | {
                        ScriptCredential: [string];
                      }
                  ];
                }
              | {
                  Pointer: {
                    slotNumber: bigint;
                    transactionIndex: bigint;
                    certificateIndex: bigint;
                  };
                }
              | null;
          },
          bigint
        ];
      }
    | 'Close';
}

export const AuctionContract = Object.assign(
  function () {
    return {
      type: 'PlutusV2',
      script:
        '59164e010000323232323232323232323232323232322323232323232322323232253330153232323232323232323232323232323232323232323232323232323232323232323232325333039302e303b375400c26464a6660766062607a6ea80044c8c94ccc10400454cc0f80e85854ccc104c11000454ccc0f4c0ccc0fcdd500a0991919299982019b8900f001153330403375e6604060426608a9810ad8799fd87980d87a80ff00330453021330453374a9001198229ba80104bd70198229998202514c0103d87a80004c0103d87980004bd7025eb8002002054ccc100c94ccc11400454cc1080fc584c94ccc118c1240084c94ccc10cc0a8c114dd50008991919299982319baf0023230283304c304d0013304c30283304c374e66098012660986ea00212f5c097ae0304e304e0013049375403e2a66608c607660906ea80604cdd7981898249baa005374c64a66608e607a01020022666605e0029101003232002302c0013304c337609801014000375001097adef6c6022232533304b302e00114c103d87a80001302c33050374c00297ae0333303300148810000b22232533304e304400114c103d87a80001302f33053375000297ae0337000020046eacc0c4c124dd5005899191929998249981299981380925eb7bdb180894ccc12ccdd7981a98271baa0010041330280023756606c609c6ea80044008c08c0044cdc40008050a50375a609c609e004609a0026eb0c130c124dd500c0a5033037001044533333304c00110011533045043161533045043161533045043161533045043163049304637540022a660889212c65787065637420496e6c696e65446174756d28696e6c5f64746d29203d20636f6e745f6269642e646174756d00163021304537540022a660860802c608e00266044012466ebcc0acc110dd5181598221baa001302b30443754605660886ea80185288a5014a02940dd698229823001182200098201baa0141533303d3375e6603a603c66084603c6608466e95200233042375001a97ae03304233303d4a2980103d87a80004c0103d87980004bd701982126010ad8799fd87b80d87a80ff004bd700028028a99981e9819181f9baa00f13301933301b0064bd6f7b63011299981f99baf3029304237540020262660380046eacc0a8c108dd500088011bab3028304037540042646464a66466082a6660826603a6eacc11c00cc06cc94ccc108c0dcc110dd50008a400026eb4c120c114dd5000992999821181b98221baa00114c103d87a80001323300100137566092608c6ea8008894ccc120004530103d87a800013232323253330483008002153330483023002130293304d375000297ae014c103d87a8000133006006003375a60940066eb8c120008c130008c128004c8cc004004dd5981698229baa00722533304700114c103d87a800013232323253330473007002153330473022002130283304c374c00297ae014c103d87a8000133006006003375660920066eb8c11c008c12c008c1240045288a9982124816069735f636f76657265642873656c6c65725f7061796f75745f6173736574732c2076616c75652e66726f6d5f6c6f76656c6163652876616c75652e6c6f76656c6163655f6f6628746869735f6269642e76616c7565292929203f2046616c73650014a026603a00464660020026eacc0b4c114dd50039129998238008a5eb7bdb1804c8c8c8c94ccc11cc01c00854ccc11cc088008400c40144cc130cdd81ba9002374c0026600c00c0066eacc12400cdd71823801182580118248009b914890014a06eacc114c118004c8ccc0040040212f5c301a0008101a000111299982280108008999801801982400119299982119baf302c3045375400202c26608e6e98cc07cdd598160011bab302d304537540026608e605a00497ae0153330423375e6058608a6ea80040144cc11cc0b0008cc11cdd31980f9bab302d0023756605a608a6ea80052f5c02004608e00460866eb0c10cc100dd50078a50153303e03a163301e00723375e604e60806ea8c09cc100dd5181418201baa001302730403754604e60806ea8008c104c108c0f8dd51820981f1baa001153303c49017465787065637420536f6d6528496e707574207b206f75747075743a20746869735f6269642c202e2e207d29203d0a202020206c6973742e66696e6428696e707574732c20666e28696e70757429207b20696e7075742e6f75747075745f7265666572656e6365203d3d206f75745f726566207d290016323300100100622533304000114c0103d87a800013232533303e3375e605060826ea80080144c07ccc10c0092f5c026600800800260880046084002607e60786ea801854cc0e92411f657870656374205370656e64286f75745f72656629203d20707572706f73650016303e303f303f303f303f303f0023758607a002607a607a0046eb0c0ec004c0dcdd5181d001181c981d000981a9baa01e375a606e60700046eb4c0d8004c0d8008c0d0004c0d0008c0c8004c0b8dd50021980c000813299999981880c080c0a998150128b0a998150128b0a998150128b0a998150128b1980d000811a99999981780f080f0a998140110b0a998140110b0a998140110b0a998140110b12999813980e8008a5eb7bdb1804c8c8cc0040052f5bded8c044a66605c00226605e66ec1301014000374c00697adef6c60132323232533302e33720910100002133033337609801014000374c00e00a2a66605c601200426606666ec13001014000374c00e00626606666ec0dd48011ba600133006006003375660600066eb8c0b8008c0c8008c0c0004c8cc0040052f5bded8c044a66605a00226605c66ec13001014000375000697adef6c60132323232533302d33720910100002133032337609801014000375000e00a2a66605a601000426606466ec13001014000375000e00626606466ec0dd48011ba800133006006003375a605e0066eb8c0b4008c0c4008c0bc004dc7a44100223233001001323300100133005004323300100100422533302e00114bd6f7b6300991981819bb0302d001374c64660020026eacc0bc008894ccc0c400452f5bded8c02646606666ec0c0c0004dd419b8148000dd6981880099801801981a801181980099801801981900118180009129998168008a5eb804c8ccc888c8cc00400400c894ccc0cc004400c4c8cc0d4dd39981a9ba90063303530320013303530330014bd7019801801981b801181a8009bae302c0013756605a002660060066062004605e00244a66605800229444c94ccc0a4cdc4a40006eb4c020dd618178010998018018008a50302f0012232333001001003002222533302c002100113233300400430300033333011002375c60560026eacc0b0004888c94ccc0b4c040004530103d87a80001300e33032374c00297ae0323330010010030022225333033002100113233300400430370033333019002375c60640026eb4c0cc004888c94ccc0d0c0a8004530103d87a80001301533039375000297ae033700004002606a004605c00444464666002002008006444a66605800420022666006006605e00466008002605c00446050605260520024460066604e664464a66604a603600220042a66604a603400220062006604c6ea8cc028008004c030c094dd5001180618129baa001330273322325333025301b001100315333025301a001100310023026375466014004002601a604a6ea8008c034c094dd5000a5eb80dd2a400044646600200200644a66604c002297ae0132325333024300500213302900233004004001133004004001302a00230280012533302200114a22940c004004894ccc084004526132533302200114984c8c94ccc080cdc81bae30223026004375c604400426600a00a6604a0040022a66042921326b65797320696e206173736f63696174697665206c697374206172656e277420696e20617363656e64696e67206f7264657200163026002302400130240012232533301d301300114c0103d87980001533301d300400114c0103d87b80001533301d533301d32533302230210011533301e3013302000114a22a66603c6028604000229405858dd5180418101baa003132533302230210011533301e3013302000114a22a66603c6028604000229405858dd5180418101baa002133301d32533302230210011533301e3013302000114a22a66603c6028604000229405858dd5180418101baa0024a09445300103d87a80001533301d32533302230210011533301e3013302000114a22a66603c6028604000229405858dd5180418101baa00314c103d87b800014c103d8798000301e3754664464a66603e602a0022a66603e602a60426ea80085300103d87a800014c103d87980001533301f30060011533301f300630213754004298103d87a800014c103d87b8000132325333021301700114c0103d87b800015333021300800114c0103d87980001325333022337100060022980103d8798000153330223370e0060022980103d87a800014c103d87b8000375a604e60486ea8010c088dd50019bad30253022375400660406ea8008c018c07cdd50011803180f9baa001370e90021111191980080080291299981100089981199bb0375200a6e980112f5bded8c0264646464a66604466e400240084cc09ccdd81ba9009374c01000a2a66604466e3c0240084c94ccc08cc064c094dd500089981419bb037520146052604c6ea80040104010ccc01c0240200044cc09ccdd81ba9002374c0026600c00c0066eacc09000cdd71811001181300118120009111191980080080291299981080089981119bb0375200a6ea00112f5bded8c0264646464a66604266e400240084cc098cdd81ba9009375001000a2a66604266e3c0240084c94ccc088c060c090dd500089981399bb037520146050604a6ea80040104010ccc01c0240200044cc098cdd81ba900237500026600c00c0066eb4c08c00cdd71810801181280118118009180e8009180e180e8008a4c2a6602c9211856616c696461746f722072657475726e65642066616c736500136563300100200c22325333015300b001132533301a00115330170031613232533301c001153301900516132533301d3020002132498cc03000c01854cc06801858c94cccccc08400454cc0680185854cc0680185854cc068018584dd68008a9980d0030b180f000980f00119299999980f80088008a9980c0020b0a9980c0020b0a9980c0020b0a9980c0020b180e000980c1baa00315333015300a00115333019301837540062930a9980b0010b0a9980b0010b180b1baa00253333330190011001153301200a16153301200a16153301200a16153301200a1633001006009225333010300630123754004264a66602a0022a660240042c26464a66602e0022a660280082c26464a6660320022a6602c00c2c26464a6660360022a660300102c264a666038603e004264649319299980d1808000899299980f8008a9980e0060b0992999810181180109924ca6660400022a6603a01a2c26464a6660440022a6603e01e2c264a666046604c00426493198090018080a998100080b1929999998138008a998100080b0a998100080b0a998100080b09bad001153302001016302400130240023253333330250011001153301e00e16153301e00e16153301e00e16153301e00e163022001153301d00d16325333333024001153301d00d16153301d00d16137580022a6603a01a2c2a6603a01a2c6042002603a6ea801c54ccc068c03c00454ccc078c074dd50038a4c2a660360162c2a660360162c60366ea8018cc02c01c02454cc06402458c94cccccc08000454cc0640245854cc0640245854cc064024584dd68008a9980c8048b180e800980e80119299999980f0008a9980b8038b0a9980b8038b0a9980b8038b09bad001153301700716301b001301b00232533333301c00110011533015005161533015005161533015005161533015005163019001301900232533333301a00110011533013003161533013003161533013003161533013003163017001301337540042a660220022c44a66601e600a60226ea80084c94ccc05000454cc044008584c8c94ccc05800454cc04c010584c94ccc05cc0680084c8c926325333015300b001132533301a001153301700816132533301b301e002132498c94ccc060c0380044c94ccc07400454cc06802c584c94ccc078c0840084c9263300e00100c153301b00c163253333330220011001153301b00c16153301b00c16153301b00c16153301b00c16301f001301b37540042a666030601a002264a66603a0022a660340162c26464a66603e0022a6603801a2c26464a6660420022a6603c01e2c264a666044604a0042930a9980f8080b1929999998130008a9980f8080b0a9980f8080b0a9980f8080b09bad001153301f0101630230013023002325333333024001153301d00e16153301d00e16153301d00e161375a0022a6603a01c2c6042002604200464a6666660440022a660360182c2a660360182c2a660360182c26eb400454cc06c03058c07c004c06cdd50010a9980c8050b180c9baa00115330180091632533333301f0011001153301800916153301800916153301800916153301800916301c001301837540062a66602a60140022a66603260306ea800c526153301600716153301600716301637540046600e00600a2a6602800a2c64a66666603600220022a6602800a2c2a6602800a2c2a6602800a2c2a6602800a2c6030002603000464a66666603200220022a660240062c2a660240062c2a660240062c2a660240062c602c00260246ea800854cc0400045888c94ccc03cc0140044c94ccc05000454cc04400c584c94ccc054c0600085261533012004163253333330190011533012004161533012004161533012004161533012004161375c002602c00260246ea800c54ccc03cc0100044c94ccc05000454cc04400c584c94ccc054c0600085261533012004163253333330190011533012004161533012004161533012004161533012004161375c002602c00260246ea800c54cc04000858c040dd50011b8748008dc3a4000a66666602200220022a660140062c2a660140062c2a660140062c2a660140062c92011572656465656d65723a2042696452656465656d65720049010f646174756d3a20426964446174756d0049011e65787065637420646174756d3a20426964446174756d203d20646174756d004901276578706563742072656465656d65723a2042696452656465656d6572203d2072656465656d6572004901a3657870656374205b5f5d203d0a202020206c6973742e66696c746572280a202020202020696e707574732c0a202020202020666e28696e70757429207b0a2020202020202020696e7075742e6f75747075742e616464726573732e7061796d656e745f63726564656e7469616c203d3d20746869735f6269642e616464726573732e7061796d656e745f63726564656e7469616c0a2020202020207d2c0a2020202029004901d6657870656374205b636f6e745f6269645d203d0a2020202020202020202020206c6973742e66696c746572280a20202020202020202020202020206f7574707574732c0a2020202020202020202020202020666e286f757470757429207b0a202020202020202020202020202020206f75747075742e616464726573732e7061796d656e745f63726564656e7469616c203d3d20746869735f6269642e616464726573732e7061796d656e745f63726564656e7469616c0a20202020202020202020202020207d2c0a2020202020202020202020202900490124657870656374206f75745f646174756d3a20426964446174756d203d20696e6c5f64746d005734ae7155ceaab9e5573eae815d0aba257481',
    };
  },
  {
    datum: {
      title: 'BidDatum',
      anyOf: [
        {
          title: 'BidDatum',
          dataType: 'constructor',
          index: 0,
          fields: [
            {
              title: 'sellerAddr',
              description:
                "A Cardano `Address` typically holding one or two credential references.\n\n Note that legacy bootstrap addresses (a.k.a. 'Byron addresses') are\n completely excluded from Plutus contexts. Thus, from an on-chain\n perspective only exists addresses of type 00, 01, ..., 07 as detailed\n in [CIP-0019 :: Shelley Addresses](https://github.com/cardano-foundation/CIPs/tree/master/CIP-0019/#shelley-addresses).",
              anyOf: [
                {
                  title: 'Address',
                  dataType: 'constructor',
                  index: 0,
                  fields: [
                    {
                      title: 'paymentCredential',
                      description:
                        'A general structure for representing an on-chain `Credential`.\n\n Credentials are always one of two kinds: a direct public/private key\n pair, or a script (native or Plutus).',
                      anyOf: [
                        {
                          title: 'VerificationKeyCredential',
                          dataType: 'constructor',
                          index: 0,
                          fields: [{ dataType: 'bytes' }],
                        },
                        {
                          title: 'ScriptCredential',
                          dataType: 'constructor',
                          index: 1,
                          fields: [{ dataType: 'bytes' }],
                        },
                      ],
                    },
                    {
                      title: 'stakeCredential',
                      anyOf: [
                        {
                          title: 'Some',
                          description: 'An optional value.',
                          dataType: 'constructor',
                          index: 0,
                          fields: [
                            {
                              description:
                                'Represent a type of object that can be represented either inline (by hash)\n or via a reference (i.e. a pointer to an on-chain location).\n\n This is mainly use for capturing pointers to a stake credential\n registration certificate in the case of so-called pointer addresses.',
                              anyOf: [
                                {
                                  title: 'Inline',
                                  dataType: 'constructor',
                                  index: 0,
                                  fields: [
                                    {
                                      description:
                                        'A general structure for representing an on-chain `Credential`.\n\n Credentials are always one of two kinds: a direct public/private key\n pair, or a script (native or Plutus).',
                                      anyOf: [
                                        {
                                          title: 'VerificationKeyCredential',
                                          dataType: 'constructor',
                                          index: 0,
                                          fields: [{ dataType: 'bytes' }],
                                        },
                                        {
                                          title: 'ScriptCredential',
                                          dataType: 'constructor',
                                          index: 1,
                                          fields: [{ dataType: 'bytes' }],
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  title: 'Pointer',
                                  dataType: 'constructor',
                                  index: 1,
                                  fields: [
                                    {
                                      dataType: 'integer',
                                      title: 'slotNumber',
                                    },
                                    {
                                      dataType: 'integer',
                                      title: 'transactionIndex',
                                    },
                                    {
                                      dataType: 'integer',
                                      title: 'certificateIndex',
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          title: 'None',
                          description: 'Nothing.',
                          dataType: 'constructor',
                          index: 1,
                          fields: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              title: 'lastBid',
              anyOf: [
                {
                  title: 'Some',
                  description: 'An optional value.',
                  dataType: 'constructor',
                  index: 0,
                  fields: [
                    {
                      dataType: 'list',
                      items: [
                        {
                          title: 'Address',
                          description:
                            "A Cardano `Address` typically holding one or two credential references.\n\n Note that legacy bootstrap addresses (a.k.a. 'Byron addresses') are\n completely excluded from Plutus contexts. Thus, from an on-chain\n perspective only exists addresses of type 00, 01, ..., 07 as detailed\n in [CIP-0019 :: Shelley Addresses](https://github.com/cardano-foundation/CIPs/tree/master/CIP-0019/#shelley-addresses).",
                          anyOf: [
                            {
                              title: 'Address',
                              dataType: 'constructor',
                              index: 0,
                              fields: [
                                {
                                  title: 'paymentCredential',
                                  description:
                                    'A general structure for representing an on-chain `Credential`.\n\n Credentials are always one of two kinds: a direct public/private key\n pair, or a script (native or Plutus).',
                                  anyOf: [
                                    {
                                      title: 'VerificationKeyCredential',
                                      dataType: 'constructor',
                                      index: 0,
                                      fields: [{ dataType: 'bytes' }],
                                    },
                                    {
                                      title: 'ScriptCredential',
                                      dataType: 'constructor',
                                      index: 1,
                                      fields: [{ dataType: 'bytes' }],
                                    },
                                  ],
                                },
                                {
                                  title: 'stakeCredential',
                                  anyOf: [
                                    {
                                      title: 'Some',
                                      description: 'An optional value.',
                                      dataType: 'constructor',
                                      index: 0,
                                      fields: [
                                        {
                                          description:
                                            'Represent a type of object that can be represented either inline (by hash)\n or via a reference (i.e. a pointer to an on-chain location).\n\n This is mainly use for capturing pointers to a stake credential\n registration certificate in the case of so-called pointer addresses.',
                                          anyOf: [
                                            {
                                              title: 'Inline',
                                              dataType: 'constructor',
                                              index: 0,
                                              fields: [
                                                {
                                                  description:
                                                    'A general structure for representing an on-chain `Credential`.\n\n Credentials are always one of two kinds: a direct public/private key\n pair, or a script (native or Plutus).',
                                                  anyOf: [
                                                    {
                                                      title:
                                                        'VerificationKeyCredential',
                                                      dataType: 'constructor',
                                                      index: 0,
                                                      fields: [
                                                        { dataType: 'bytes' },
                                                      ],
                                                    },
                                                    {
                                                      title: 'ScriptCredential',
                                                      dataType: 'constructor',
                                                      index: 1,
                                                      fields: [
                                                        { dataType: 'bytes' },
                                                      ],
                                                    },
                                                  ],
                                                },
                                              ],
                                            },
                                            {
                                              title: 'Pointer',
                                              dataType: 'constructor',
                                              index: 1,
                                              fields: [
                                                {
                                                  dataType: 'integer',
                                                  title: 'slotNumber',
                                                },
                                                {
                                                  dataType: 'integer',
                                                  title: 'transactionIndex',
                                                },
                                                {
                                                  dataType: 'integer',
                                                  title: 'certificateIndex',
                                                },
                                              ],
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                    {
                                      title: 'None',
                                      description: 'Nothing.',
                                      dataType: 'constructor',
                                      index: 1,
                                      fields: [],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        { dataType: 'integer' },
                      ],
                    },
                  ],
                },
                {
                  title: 'None',
                  description: 'Nothing.',
                  dataType: 'constructor',
                  index: 1,
                  fields: [],
                },
              ],
            },
            { dataType: 'integer', title: 'deadline' },
            { dataType: 'integer', title: 'reservePrice' },
          ],
        },
      ],
    },
  },
  {
    redeemer: {
      title: 'BidRedeemer',
      anyOf: [
        {
          title: 'Bid',
          dataType: 'constructor',
          index: 0,
          fields: [
            {
              description:
                "A Cardano `Address` typically holding one or two credential references.\n\n Note that legacy bootstrap addresses (a.k.a. 'Byron addresses') are\n completely excluded from Plutus contexts. Thus, from an on-chain\n perspective only exists addresses of type 00, 01, ..., 07 as detailed\n in [CIP-0019 :: Shelley Addresses](https://github.com/cardano-foundation/CIPs/tree/master/CIP-0019/#shelley-addresses).",
              anyOf: [
                {
                  title: 'Address',
                  dataType: 'constructor',
                  index: 0,
                  fields: [
                    {
                      title: 'paymentCredential',
                      description:
                        'A general structure for representing an on-chain `Credential`.\n\n Credentials are always one of two kinds: a direct public/private key\n pair, or a script (native or Plutus).',
                      anyOf: [
                        {
                          title: 'VerificationKeyCredential',
                          dataType: 'constructor',
                          index: 0,
                          fields: [{ dataType: 'bytes' }],
                        },
                        {
                          title: 'ScriptCredential',
                          dataType: 'constructor',
                          index: 1,
                          fields: [{ dataType: 'bytes' }],
                        },
                      ],
                    },
                    {
                      title: 'stakeCredential',
                      anyOf: [
                        {
                          title: 'Some',
                          description: 'An optional value.',
                          dataType: 'constructor',
                          index: 0,
                          fields: [
                            {
                              description:
                                'Represent a type of object that can be represented either inline (by hash)\n or via a reference (i.e. a pointer to an on-chain location).\n\n This is mainly use for capturing pointers to a stake credential\n registration certificate in the case of so-called pointer addresses.',
                              anyOf: [
                                {
                                  title: 'Inline',
                                  dataType: 'constructor',
                                  index: 0,
                                  fields: [
                                    {
                                      description:
                                        'A general structure for representing an on-chain `Credential`.\n\n Credentials are always one of two kinds: a direct public/private key\n pair, or a script (native or Plutus).',
                                      anyOf: [
                                        {
                                          title: 'VerificationKeyCredential',
                                          dataType: 'constructor',
                                          index: 0,
                                          fields: [{ dataType: 'bytes' }],
                                        },
                                        {
                                          title: 'ScriptCredential',
                                          dataType: 'constructor',
                                          index: 1,
                                          fields: [{ dataType: 'bytes' }],
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  title: 'Pointer',
                                  dataType: 'constructor',
                                  index: 1,
                                  fields: [
                                    {
                                      dataType: 'integer',
                                      title: 'slotNumber',
                                    },
                                    {
                                      dataType: 'integer',
                                      title: 'transactionIndex',
                                    },
                                    {
                                      dataType: 'integer',
                                      title: 'certificateIndex',
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          title: 'None',
                          description: 'Nothing.',
                          dataType: 'constructor',
                          index: 1,
                          fields: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            { dataType: 'integer' },
          ],
        },
        {
          title: 'Close',
          dataType: 'constructor',
          index: 1,
          fields: [],
        },
      ],
    },
  }
) as unknown as AuctionContract;
