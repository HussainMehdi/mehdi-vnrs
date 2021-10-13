hardhat node &
GID=$!
hardhat test
kill $GID
kill -9 $GID