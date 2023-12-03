import React, { useState, useEffect } from "react";
import DVideo from "../abis/DVideo.json";

import axios from "axios";
import Web3 from "web3";
import "./App.css";
function Main() {
  const [file, setFile] = useState(null);
  const [account, setAccount] = useState("");
  const [dvideo, setDvideo] = useState(null); //smart contract
  const [videos, setVideo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentHash, setHash] = useState(null);
  const [videoTitle, setVideoTitle] = useState(null);
  const [videoCount, setVideoCount] = useState(0);

  useEffect(() => {
    (async function () {
      await loadWeb3();
      await loadBlockchainData();
    })();
  }, []);

  let captureFile = (event) => {
    event.preventDefault();
    setFile(event.target.files[0]);
  };

  let uploadVideo = async (title) => {
    setUploading(true)
    console.log("title", title);
    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("pinataMetadata", {
            name: title,
            keyvalues: {
              extension: ".mp4",
              fileName: title,
            },
        });

        const resFile = await axios({
          method: "post",
          url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
          data: formData,
          headers: {
            pinata_api_key: `${"656d2c72f58294627b7e"}`,
            pinata_secret_api_key: `${"49be5dc16fe684dbf03b979487418525e5294e8b6e7b6f080a7c695ad3c2d6ca"}`,
            "Content-Type": "multipart/form-data",
          },
        });

        const ImgHash = `https://indigo-select-tyrannosaurus-315.mypinata.cloud/ipfs/${resFile.data.IpfsHash}`;
        console.log(resFile.data.IpfsHash, " ", title);

        await dvideo.methods
          .uploadVideo(resFile.data.IpfsHash, title)
          .send({ from: account })
          .on("transactionHash", (tx) => {
            console.log("tx", tx);
          })
          .on("receipt", (receipt) => {
            setUploading(false)
            console.log("receipt", receipt);
          });
        //Take a look at your Pinata Pinned section, you will see a new file added to you list.
      } catch (error) {
        setUploading(false)
        console.log("Error sending File to IPFS: ");
        console.log(error);
      }
    }
  };

 

  async function loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  }

  async function loadBlockchainData() {
    const web3 = window.web3;
    // Load account
    const accounts = await web3.eth.getAccounts();
    setAccount(accounts[0]);
    // Network ID
    const networkId = await web3.eth.net.getId();
    console.log("networkId", networkId);
    const networkData = DVideo;
    if (networkData) {
      const dvideo = new web3.eth.Contract(
        networkData.abi,
        networkData.address
      );
      setDvideo(dvideo);
      const count = await dvideo.methods.videoCount().call();
      console.log("videosCount", count);
      setVideoCount(count);
        let arr = []
      // Load videos, sort by newest
      for (var i =1; i <= count; i++) {
        console.log(i)
        const video = await dvideo.methods.videos(i).call();
        console.log(video)
        arr.push(video)
      }
      setVideo(arr);


    } else {
      window.alert("DVideo contract not deployed to detected network.");
    }
  }

  return (
    <>
      {!loading ? (
        <div className="">
          <br></br>
          &nbsp;
          <br></br>
          <div className="">
            <div className="" style={{ maxHeight: "768px", minWidth: "175px" }}>
              <h5>
                <b>Upload Video</b>
              </h5>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  uploadVideo(videoTitle);
                }}
              >
                &nbsp;
                <input
                  type="file"
                  accept=".mp4, .mkv .ogg .wmv"
                  onChange={captureFile}
                  style={{ width: "250px" }}
                />
                <div className="">
                  <input
                    id="videoTitle"
                    type="text"
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className=""
                    placeholder="Title..."
                    required
                  />
                </div>
                <button type="submit" className="">
                {uploading?"Uploading...":  "Upload"}
                </button>
                &nbsp;
              </form>
              {videos.map((video, key) => (
                <div className="" key={key}>
                  <div className="">
                    <video
                      style={{
                        width: "300px",
                        height: "240px",
                        outline: "none",
                        border: "5px solid #45c9d0",
                        padding: "10px",
                      }}
                      controls
                      className=""
                    >
                      <source
                        src={`https://indigo-select-tyrannosaurus-315.mypinata.cloud/ipfs/${video.hash}`}
                        type="video/mp4"
                      />
                    </video>
                  </div>
                  <h3>
                    <b>
                      <i>{video.title}</i>
                    </b>
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        "Loading"
      )}
    </>
  );
}

export default Main;
