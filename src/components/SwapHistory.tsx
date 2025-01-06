import {
  Box,
  Button,
  Card,
  Icon,
  Section,
  Text,
} from '@metamask/snaps-sdk/jsx';
import { BlockNumberResponse, MatchedOrder } from '../lib/types';
import {
  baseToDecimal,
  getFormattedDate,
  getUserFriendlyStatus,
  parseStatus,
} from '../lib/utils';

type Props = {
  orders?: MatchedOrder[];
  blockNumbers?: BlockNumberResponse;
  error?: string;
};

const SwapHistory = ({ orders, blockNumbers, error }: Props) => {
  const hasError = Boolean(error);

  return (
    <Box>
      <Box direction="horizontal" alignment="center">
        <Button name="back" type="button">
          Back to Homepage
        </Button>
      </Box>
      <Box>
        {hasError ? (
          <Box direction="horizontal" alignment="center">
            <Icon name="warning" size="md" />
            <Text>{error!}</Text>
          </Box>
        ) : orders!.length > 0 ? (
          orders!.map((order) => {
            const inAmount = baseToDecimal(order.source_swap.amount, 8);
            const outAmount = baseToDecimal(order.destination_swap.amount, 8);
            const orderStatus = parseStatus(order, blockNumbers!);
            const label = getUserFriendlyStatus(orderStatus);
            const date = getFormattedDate(order.created_at);
            return (
              <Section>
                <Text alignment="center">{date}</Text>
                <Card
                  title="BTC"
                  description="WBTC"
                  value={inAmount.toString()}
                  extra={outAmount.toString()}
                />
                <Card title="Status" value={label} />
              </Section>
            );
          })
        ) : (
          <Text>No orders found.</Text>
        )}
      </Box>
    </Box>
  );
};

export default SwapHistory;
