import React, { useState } from 'react';
import { ethers } from 'ethers';
import contractABI from '../contractABI';

const CONTRACT_ADDRESS = '0x37b8AcD33DF268D2F63f807D9E84ac53e6f78470';

const AgentInteractionComponent = () => {
    const [query, setQuery] = useState('');
    const [maxIterations, setMaxIterations] = useState(1);
    const [agentId, setAgentId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isFinished, setIsFinished] = useState(false);

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

    const runAgent = async () => {
        try {
            const tx = await contract.runAgent(query, maxIterations);
            console.log("Transaction hash:", tx.hash);
            const receipt = await tx.wait();
            console.log("Transaction confirmed:", receipt);
            const newAgentId = receipt.events[1].args.runId.toNumber();
            setAgentId(newAgentId);
        } catch (error) {
            console.error("Error running agent:", error);
        }
    };

    const getMessageHistory = async () => {
        try {
            const msgs = await contract.getMessageHistory(agentId);
            setMessages(msgs);
        } catch (error) {
            console.error("Error fetching message history:", error);
        }
    };

    const checkIsFinished = async () => {
        try {
            const finished = await contract.isRunFinished(agentId);
            setIsFinished(finished);
        } catch (error) {
            console.error("Error checking if run is finished:", error);
        }
    };

    return (
        <div>
            <input
                type="text"
                id="queryAgent"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter query"
            />
            <input
                type="number"
                value={maxIterations}
                id="maxIterations"
                onChange={(e) => setMaxIterations(Number(e.target.value))}
                placeholder="Max Iterations"
            />
            <button id='runAgent' onClick={runAgent}>Run Agent</button>

            {agentId && (
                <>
                    <button onClick={getMessageHistory}>Get Message History</button>
                    <button onClick={checkIsFinished}>Check if Finished</button>
                    {isFinished && <p>Run is finished!</p>}
                    <div>
                        {messages.map((message, index) => (
                            <div key={index}>
                                <p>Role: {message.role}</p>
                                <p>Content: {message.content[0].value}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default AgentInteractionComponent;
