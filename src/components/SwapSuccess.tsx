import { Bold, Box, Divider, Image, Text } from '@metamask/snaps-sdk/jsx'
import successIcon from "../assets/success.svg";


const SwapSuccess = () => {
  return (
    <Box direction='vertical' alignment='center' center>
      <Image src={successIcon}/>
        <Text alignment='center'>
            <Bold>
                Swap SuccessFull
            </Bold>
        </Text>
        <Divider />
    </Box>

  )
}

export default SwapSuccess