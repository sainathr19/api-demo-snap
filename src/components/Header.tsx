import { Box, Button, Section, Text, Tooltip } from '@metamask/snaps-sdk/jsx';
import { baseToDecimal, truncate } from '../lib/utils';

type Props = {
  btcAddress: string;
  btcBalance: number;
};

const Header = ({ btcAddress, btcBalance }: Props) => {
  const address = truncate(btcAddress, 3);
  const formattedBalace = baseToDecimal(btcBalance, 8).toFixed(6);
  return (
    <Box>
      <Box direction="horizontal" alignment="space-between">
        <Button variant="primary" name="copy_address" type="button">
          {address}
        </Button>
        <Text>{`${formattedBalace} tBTC`}</Text>
        <Button name="history" type="button">
          History
        </Button>
      </Box>
    </Box>
  );
};

export default Header;
