pragma solidity >=0.8.0;

contract Adoption {
    address[16] public adopters;

    function adopt(uint petId) public returns (uint) {
        require(petId >= 0 && petId <= 15);
        require(adopters[petId] == address(0));
        adopters[petId] = msg.sender;
        return petId;
    }

    function abandon(uint petId) public returns (uint) {
        require(petId >= 0 && petId <= 15);
        require(adopters[petId] == msg.sender);
        adopters[petId] = address(0);
        return petId;
    }


    function getAdopters() public view returns (address[16] memory) {
        return adopters;
    }
}