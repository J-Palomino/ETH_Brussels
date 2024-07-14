import React, { useState } from 'react';
import { ethers } from 'ethers';
import contractAbi from '../contractABI.js'

const RunAgentForm = () => {
  const [query, setQuery] = useState('');
  const [maxIterations, setMaxIterations] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [error, setError] = useState('');

  const handleQueryChange = (e) => setQuery(e.target.value);
  const handleMaxIterationsChange = (e) => setMaxIterations(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTransactionHash('');
    setError('');

    if (!window.ethereum) {
      setError('MetaMask is not installed.');
      return;
    }

    try {
      // Connect to the Ethereum provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []); // Request user's MetaMask account

      const signer = provider.getSigner();
      const contractAddress = '0x37b8AcD33DF268D2F63f807D9E84ac53e6f78470'; // Replace with your contract address
      const contractABI = contractAbi; // Replace with your contract ABI

      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Call the runAgent function
      const tx = await contract.runAgent(query, parseInt(maxIterations));
      console.log('Transaction hash:', tx.hash);
      setTransactionHash(tx.hash);

      // Wait for the transaction to be confirmed
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

    } catch (error) {
      console.error('Error running agent:', error);
      setError(error.message);
    }
  };

  return (
    <div>
      <h1>Run Agent</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Query:
          <input type="text" value={query} onChange={handleQueryChange} required />
        </label>
        <br />
        <label>
          Max Iterations:
          <input type="number" value={maxIterations} onChange={handleMaxIterationsChange} required />
        </label>
        <br />
        <button type="submit">Run Agent</button>
      </form>
      {transactionHash && (
        <div>
          <p>Transaction Hash: {transactionHash}</p>
        </div>
      )}
      {error && (
        <div>
          <p style={{ color: 'red' }}>{error}</p>
        </div>
      )}
    </div>
  );
};

export default RunAgentForm;
