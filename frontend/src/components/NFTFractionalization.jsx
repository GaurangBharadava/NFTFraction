import { motion, AnimatePresence } from "framer-motion";
import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog";
import { FileUpload } from "primereact/fileupload";
import { ProgressBar } from "primereact/progressbar";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-dark-indigo/theme.css";
import { Slider } from "primereact/slider";
import { Tag } from "primereact/tag";
import { Timeline } from "primereact/timeline";
import { Toast } from "primereact/toast";
import React, { useState, useEffect, useRef } from "react";

export default function NFTFractionalization() {
  const [step, setStep] = useState(0); // Start at step 0 for wallet connection
  const [uploadedNFT, setUploadedNFT] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tokenCount, setTokenCount] = useState(100);
  const [tokenPrice, setTokenPrice] = useState(0.005);
  const toast = useRef(null);
  const [tokenSymbol, setTokenSymbol] = useState(`NFT-${Math.floor(Math.random() * 1000)}`);
  
  // Wallet states
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Available wallet options
  const walletOptions = [
    { name: 'MetaMask', icon: 'pi pi-shield', type: 'metamask' },
    { name: 'Coinbase Wallet', icon: 'pi pi-wallet', type: 'coinbase' },
    { name: 'WalletConnect', icon: 'pi pi-link', type: 'walletconnect' }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0px 0px 8px rgb(124, 58, 237)" },
    tap: { scale: 0.98 }
  };

  const cardVariants = {
    hover: { 
      scale: 1.02, 
      boxShadow: "0px 0px 15px rgba(138, 75, 242, 0.3)",
      transition: { duration: 0.2 }
    }
  };

  // Recent activity timeline data
  const events = [
    { status: 'User259 purchased 3 tokens', time: '2 minutes ago', icon: 'pi pi-shopping-cart', color: '#4CAF50' },
    { status: 'User782 transferred 5 tokens', time: '5 minutes ago', icon: 'pi pi-send', color: '#9C27B0' },
    { status: 'User191 added liquidity', time: '10 minutes ago', icon: 'pi pi-dollar', color: '#2196F3' },
  ];
  
  // Simulated progress for fractionalization process
  useEffect(() => {
    if (step === 3) {
      const timer = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(timer);
            if (toast.current) {
              toast.current.show({
                severity: 'success',
                summary: 'Success',
                detail: 'NFT Fractionalization Complete',
                life: 3000
              });
            }
            return 100;
          }
          return prevProgress + 5;
        });
      }, 150);
      return () => clearInterval(timer);
    }
  }, [step]);

  // Check if MetaMask is installed
  const checkIfWalletIsInstalled = (walletType) => {
    if (walletType === 'metamask') {
      return typeof window.ethereum !== 'undefined';
    } else if (walletType === 'coinbase') {
      // Check for Coinbase Wallet
      return typeof window.coinbaseWalletExtension !== 'undefined';
    }
    // For WalletConnect, we'll return true since it's a protocol not an extension
    return true;
  };

  // Actual wallet connection function
  const connectWallet = async (walletOption) => {
    setIsConnecting(true);
    
    try {
      if (!checkIfWalletIsInstalled(walletOption.type)) {
        if (toast.current) {
          toast.current.show({
            severity: 'error',
            summary: 'Wallet Not Found',
            detail: `${walletOption.name} is not installed. Please install it first.`,
            life: 5000
          });
        }
        setIsConnecting(false);
        return;
      }
      
      // Connect to MetaMask
      if (walletOption.type === 'metamask') {
        try {
          // Request account access
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          // Get the first account
          const account = accounts[0];
          
          // Get account balance
          const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [account, 'latest']
          });
          
          // Convert balance from wei to ETH (1 ETH = 10^18 wei)
          const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
          
          // Set wallet info
          setWalletAddress(account);
          setWalletBalance(parseFloat(balanceInEth.toFixed(4)));
          setWalletConnected(true);
          setStep(1);
          
          // Setup event listeners for account changes
          window.ethereum.on('accountsChanged', function (accounts) {
            if (accounts.length === 0) {
              // User disconnected their wallet
              disconnectWallet();
            } else {
              setWalletAddress(accounts[0]);
            }
          });
          
          if (toast.current) {
            toast.current.show({
              severity: 'success',
              summary: 'Wallet Connected',
              detail: `Connected to ${walletOption.name}`,
              life: 3000
            });
          }
        } catch (error) {
          console.error("Error connecting to MetaMask:", error);
          if (toast.current) {
            toast.current.show({
              severity: 'error',
              summary: 'Connection Failed',
              detail: error.message || "Failed to connect to wallet",
              life: 5000
            });
          }
        }
      }
      // Connect to Coinbase Wallet - simplified example
      else if (walletOption.type === 'coinbase') {
        try {
          const accounts = await window.coinbaseWalletExtension.request({ method: 'eth_requestAccounts' });
          // Similar implementation as MetaMask but using the Coinbase provider
          // For brevity, just showing it as a placeholder
          setWalletAddress(accounts[0]);
          setWalletBalance(0.1); // Placeholder
          setWalletConnected(true);
          setStep(1);
        } catch (error) {
          console.error("Error connecting to Coinbase Wallet:", error);
          if (toast.current) {
            toast.current.show({
              severity: 'error',
              summary: 'Connection Failed',
              detail: error.message || "Failed to connect to wallet",
              life: 5000
            });
          }
        }
      }
      // WalletConnect would require additional libraries and setup
      else if (walletOption.type === 'walletconnect') {
        // Here you would initialize WalletConnect
        // This requires the WalletConnect library which isn't imported
        // For now, show a message that this is not implemented
        if (toast.current) {
          toast.current.show({
            severity: 'info',
            summary: 'Not Implemented',
            detail: 'WalletConnect integration requires additional setup',
            life: 3000
          });
        }
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      if (toast.current) {
        toast.current.show({
          severity: 'error',
          summary: 'Connection Error',
          detail: error.message || "An unknown error occurred",
          life: 5000
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    // Note: There's no standard way to "disconnect" from MetaMask via code
    // The best practice is to clear your app's state
    setWalletConnected(false);
    setWalletAddress('');
    setWalletBalance(0);
    setStep(0);
    
    if (toast.current) {
      toast.current.show({
        severity: 'info',
        summary: 'Wallet Disconnected',
        detail: 'Your wallet has been disconnected',
        life: 3000
      });
    }
  };

  const handleFileUpload = (event) => {
    setUploadedNFT(URL.createObjectURL(event.files[0]));
    setStep(2);
    if (toast.current) {
      toast.current.show({
        severity: 'info',
        summary: 'NFT Uploaded',
        detail: 'Configure your token distribution',
        life: 3000
      });
    }
  };
  
  const handleFractionalize = () => {
    setStep(3);
    setProgress(0);
  };

  // Custom template for timeline
  const customizedMarker = (item) => {
    return (
      <span className="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1" style={{ backgroundColor: item.color }}>
        <i className={item.icon}></i>
      </span>
    );
  };

  const customizedContent = (item) => {
    return (
      <Card className="mb-3" style={{ background: 'rgba(30, 30, 30, 0.7)', border: '1px solid rgba(100, 100, 100, 0.2)' }}>
        <div className="flex flex-column md:flex-row align-items-center justify-content-between">
          <span className="text-sm">{item.status}</span>
          <span className="text-sm text-color-secondary">{item.time}</span>
        </div>
      </Card>
    );
  };

  // Dialog footer
  const dialogFooter = (
    <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
      <Button label="Close" icon="pi pi-check" onClick={() => setIsDialogOpen(false)} 
        className="p-button-gradient" style={{background: 'linear-gradient(to right, #6366F1, #8B5CF6)'}} />
    </motion.div>
  );

  // Format wallet address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="min-h-screen p-6 flex items-center justify-center" 
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #1E40AF 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradientBG 15s ease infinite'
      }}>
      
      <Toast ref={toast} position="top-right" />
      
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-md"
      >
        <Card className="shadow-8" style={{
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '1rem'
        }}>
          <div className="text-center mb-5">
            <h1 className="text-4xl font-bold mb-2" style={{
              background: 'linear-gradient(to right, #A855F7, #6366F1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>NFT Fractionalization</h1>
            <p className="text-gray-400">Transform your NFT into tradable tokens</p>
          </div>
          
          {/* Wallet Info Bar - Show when connected */}
          {walletConnected && (
            <div className="mb-5 p-3 flex justify-content-between align-items-center" style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '0.5rem'
            }}>
              <div className="flex align-items-center">
                <i className="pi pi-wallet text-xl mr-2" style={{color: '#A855F7'}}></i>
                <div>
                  <div className="text-sm font-medium">{formatAddress(walletAddress)}</div>
                  <div className="text-xs text-gray-400">Balance: {walletBalance} ETH</div>
                </div>
              </div>
              <Button 
                icon="pi pi-power-off" 
                className="p-button-rounded p-button-text p-button-sm"
                onClick={disconnectWallet}
                tooltip="Disconnect wallet"
                tooltipOptions={{ position: 'bottom' }}
              />
            </div>
          )}
          
          <AnimatePresence mode="wait">
            {/* Step 0: Connect Wallet */}
            {step === 0 && (
              <motion.div
                key="connect-wallet"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-column align-items-center"
              >
                <Card className="w-full mb-4" style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}>
                  <div className="flex flex-column align-items-center">
                    <i className="pi pi-link-alt text-5xl text-primary mb-3" style={{color: '#A855F7'}}></i>
                    <h3 className="mb-3">Connect Your Wallet</h3>
                    <p className="text-center text-sm text-gray-400 mb-4">
                      Connect your wallet to begin the fractionalization process
                    </p>
                    
                    {isConnecting ? (
                      <div className="text-center w-full">
                        <i className="pi pi-spin pi-spinner text-3xl mb-3" style={{color: '#A855F7'}}></i>
                        <p>Connecting to wallet...</p>
                      </div>
                    ) : (
                      <div className="w-full">
                        {walletOptions.map((wallet, index) => (
                          <motion.div 
                            key={index}
                            variants={cardVariants}
                            whileHover="hover"
                            className="mb-3"
                          >
                            <Button 
                              label={`Connect with ${wallet.name}`} 
                              icon={wallet.icon} 
                              onClick={() => connectWallet(wallet)} 
                              className="w-full p-button-outlined p-button-lg flex align-items-center justify-content-start"
                              style={{
                                border: '1px solid rgba(99, 102, 241, 0.4)',
                                height: '3.5rem'
                              }} 
                            />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
                
                <div className="flex gap-3 justify-content-center mt-3">
                  <Tag icon="pi pi-info-circle" severity="info" value="First time? Create a wallet" />
                  <Tag icon="pi pi-shield" severity="warning" value="Secure connection" />
                </div>
              </motion.div>
            )}
            
            {/* Step 1: Upload NFT */}
            {step === 1 && (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-column align-items-center"
              >
                <Card className="w-full mb-4" style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}>
                  <div className="flex flex-column align-items-center">
                    <i className="pi pi-cloud-upload text-5xl text-primary mb-3" style={{color: '#A855F7'}}></i>
                    <h3 className="mb-3">Upload Your NFT</h3>
                    <p className="text-center text-sm text-gray-400 mb-4">
                      Select your NFT image to begin the fractionalization process
                    </p>
                    <FileUpload 
                      mode="advanced" 
                      auto 
                      customUpload
                      uploadHandler={handleFileUpload}
                      accept="image/*" 
                      maxFileSize={10000000}
                      chooseLabel="Select NFT"
                      className="w-full"
                      emptyTemplate={<p className="m-0">Drag and drop your NFT image here</p>}
                    />
                  </div>
                </Card>
                
                <div className="flex gap-3 justify-content-center mt-3">
                  <Tag icon="pi pi-check" severity="info" value="PNG, JPG, GIF supported" />
                  <Tag icon="pi pi-info-circle" severity="warning" value="Max 10MB" />
                </div>
              </motion.div>
            )}
            
            {/* Step 2: Configure Tokens */}
            {step === 2 && uploadedNFT && (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-column align-items-center"
              >
                <motion.div 
                  whileHover={{ scale: 1.03 }}
                  className="mb-4 relative" 
                  style={{ 
                    padding: '3px',
                    background: 'linear-gradient(45deg, #A855F7, #6366F1)',
                    borderRadius: '0.75rem'
                  }}
                >
                  <img 
                    src={uploadedNFT} 
                    alt="NFT Preview" 
                    className="w-64 h-64 object-cover" 
                    style={{borderRadius: '0.75rem'}} 
                  />
                </motion.div>
                
                <Card className="w-full mb-4" style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}>
                  <h3 className="mb-3">Configure Tokens</h3>
                  
                  <div className="mb-4">
                    <label htmlFor="token-count" className="block mb-2">Number of Tokens: {tokenCount}</label>
                    <Slider 
                      id="token-count"
                      value={tokenCount} 
                      onChange={(e) => setTokenCount(e.value)} 
                      min={10} 
                      max={1000}
                      className="w-full" 
                    />
                    <div className="flex justify-content-between mt-2">
                      <small className="text-gray-400">10</small>
                      <small className="text-gray-400">1000</small>
                    </div>
                  </div>
                  
                  <div className="flex justify-content-between mb-3">
                    <div>
                      <span className="text-gray-400">Token Symbol</span>
                      <p className="font-medium">{tokenSymbol}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Est. Token Price</span>
                      <p className="font-medium">${tokenPrice} ETH</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Total Value</span>
                      <p className="font-medium">${(tokenCount * tokenPrice).toFixed(2)} ETH</p>
                    </div>
                  </div>
                </Card>
                
                <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap" className="w-full">
                  <Button 
                    label="Fractionalize NFT" 
                    icon="pi pi-lock" 
                    onClick={handleFractionalize} 
                    className="w-full p-button-gradient p-button-lg"
                    style={{
                      background: 'linear-gradient(to right, #8B5CF6, #6366F1)',
                      border: 'none'
                    }} 
                  />
                </motion.div>
              </motion.div>
            )}
            
            {/* Step 3: Processing/Complete */}
            {step === 3 && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-column align-items-center"
              >
                <Card className="w-full mb-4" style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}>
                  <div className="text-center mb-4">
                    {progress < 100 ? (
                      <i className="pi pi-spin pi-spinner text-5xl text-primary mb-3" style={{color: '#A855F7'}}></i>
                    ) : (
                      <i className="pi pi-check-circle text-5xl mb-3 text-green-500"></i>
                    )}
                    
                    <h3 className="mb-3">
                      {progress < 100 ? 'Fractionalizing your NFT' : 'Fractionalization Complete!'}
                    </h3>
                    
                    <ProgressBar 
                      value={progress} 
                      showValue={true} 
                      className="mb-3"
                      style={{
                        height: '10px',
                        background: 'rgba(100, 100, 100, 0.2)'
                      }}
                    />
                    
                    {progress < 100 ? (
                      <p className="text-gray-400">Please wait while we process your NFT</p>
                    ) : (
                      <p className="text-gray-400">{tokenCount} tokens have been created successfully!</p>
                    )}
                  </div>
                  
                  {progress === 100 && (
                    <div>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="p-3 text-center" style={{
                          background: 'rgba(30, 30, 30, 0.5)',
                          borderRadius: '0.5rem',
                          border: '1px solid rgba(100, 100, 100, 0.2)'
                        }}>
                          <p className="text-xs text-gray-400 mb-1">Token Symbol</p>
                          <p className="font-medium">{tokenSymbol}</p>
                        </div>
                        <div className="p-3 text-center" style={{
                          background: 'rgba(30, 30, 30, 0.5)',
                          borderRadius: '0.5rem',
                          border: '1px solid rgba(100, 100, 100, 0.2)'
                        }}>
                          <p className="text-xs text-gray-400 mb-1">Token Price</p>
                          <p className="font-medium">${tokenPrice} ETH</p>
                        </div>
                        <div className="p-3 text-center" style={{
                          background: 'rgba(30, 30, 30, 0.5)',
                          borderRadius: '0.5rem',
                          border: '1px solid rgba(100, 100, 100, 0.2)'
                        }}>
                          <p className="text-xs text-gray-400 mb-1">Total Supply</p>
                          <p className="font-medium">{tokenCount}</p>
                        </div>
                      </div>
                      
                      <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap" className="w-full">
                        <Button 
                          label="Manage Tokens" 
                          icon="pi pi-cog" 
                          onClick={() => setIsDialogOpen(true)} 
                          className="w-full p-button-gradient p-button-lg"
                          style={{
                            background: 'linear-gradient(to right, #8B5CF6, #6366F1)',
                            border: 'none'
                          }} 
                        />
                      </motion.div>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
      
      <Dialog 
        header="Manage Your ERC20 Tokens" 
        visible={isDialogOpen} 
        onHide={() => setIsDialogOpen(false)}
        style={{ width: '450px' }}
        className="p-dialog-custom"
        contentStyle={{ 
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '1.5rem'
        }}
        footer={dialogFooter}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        headerStyle={{ padding: '1rem 1.5rem' }}
        showHeader={false} // Hide default header
      >
        {/* Custom header without close icon */}
        <div className="flex align-items-center justify-content-between mb-4">
          <span className="text-xl font-bold">Manage Your ERC20 Tokens</span>
        </div>

        <div className="p-3 mb-4" style={{
          background: 'rgba(30, 30, 30, 0.5)',
          borderRadius: '0.5rem',
          border: '1px solid rgba(100, 100, 100, 0.2)'
        }}>
          <div className="flex justify-content-between mb-2">
            <span className="text-gray-300">Available Tokens:</span>
            <span className="font-medium">{tokenCount}</span>
          </div>
          <div className="flex justify-content-between mb-2">
            <span className="text-gray-300">Token Value:</span>
            <span className="font-medium">${tokenPrice} ETH per token</span>
          </div>
          <div className="flex justify-content-between">
            <span className="text-gray-300">Total Value:</span>
            <span className="font-medium">${(tokenCount * tokenPrice).toFixed(2)} ETH</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
            <Button 
              label="Trade" 
              icon="pi pi-sync" 
              className="w-full p-button"
              style={{
                background: '#3B82F6',
                border: 'none'
              }} 
            />
          </motion.div>
          <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
            <Button 
              label="Transfer" 
              icon="pi pi-send" 
              className="w-full p-button"
              style={{
                background: '#8B5CF6',
                border: 'none'
              }} 
            />
          </motion.div>
        </div>
        
        <div className="mb-3">
          <h3>Recent Activity</h3>
        </div>
        
        <Timeline 
          value={events} 
          content={customizedContent} 
          marker={customizedMarker} 
          className="custom-timeline" 
        />
      </Dialog>
    </div>
  );
}