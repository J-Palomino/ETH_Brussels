const contractAbi = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "initialOracleAddress",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "systemPrompt",
                "type": "string"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "runId",
                "type": "uint256"
            }
        ],
        "name": "AgentRunCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOracleAddress",
                "type": "address"
            }
        ],
        "name": "OracleAddressUpdated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOracleAddress",
                "type": "address"
            }
        ],
        "name": "setOracleAddress",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "query",
                "type": "string"
            },
            {
                "internalType": "uint8",
                "name": "max_iterations",
                "type": "uint8"
            }
        ],
        "name": "runAgent",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "agentId",
                "type": "uint256"
            }
        ],
        "name": "getMessageHistory",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "role",
                        "type": "string"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "contentType",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "value",
                                "type": "string"
                            }
                        ],
                        "internalType": "struct IOracle.Content[]",
                        "name": "content",
                        "type": "tuple[]"
                    }
                ],
                "internalType": "struct IOracle.Message[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "runId",
                "type": "uint256"
            }
        ],
        "name": "isRunFinished",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "prompt",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

export default contractAbi;