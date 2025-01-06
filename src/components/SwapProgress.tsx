import {
  Box,
  Card,
  Heading,
  Row,
  Section,
  Spinner,
  Text,
} from '@metamask/snaps-sdk/jsx';
import { BlockNumberResponse, MatchedOrder } from '../lib/types';
import {
  baseToDecimal,
  getUserFriendlyStatus,
  parseStatus,
} from '../lib/utils';
import btcicon from '../assets/btc.svg';
import wbtcicon from '../assets/wbtc.svg';

type Props = {
  order: MatchedOrder;
  blockNumbers: BlockNumberResponse;
};

const SwapProgress = ({order , blockNumbers}: Props) => {

    
  if (!order || !blockNumbers) {
    return (
      <Box>
        <Heading>Please wait...</Heading>
        <Spinner />
      </Box>
    );
  }

  const status = parseStatus(order, blockNumbers);
  const userFriendlyStatus = status && getUserFriendlyStatus(status);

  const inAmount = baseToDecimal(order.source_swap.amount, 8);
  const inTokenPrice = order.create_order.additional_data.input_token_price;
  const inAmountUsd = inAmount * inTokenPrice;
  const outAmount = baseToDecimal(order.destination_swap.amount, 8);
  const outTokenPrice = order.create_order.additional_data.output_token_price;
  const outAmountUsd = outAmount * outTokenPrice;

  const fee = (inAmountUsd - outAmountUsd).toFixed(2);

  return (
    <Box>
      <Section>
        <Card
          image={btcicon}
          title="BTC"
          description={inTokenPrice.toFixed(2)}
          value={inAmount.toString()}
          extra={`$${inAmountUsd.toFixed(2)}`}
        />
      </Section>
      <Section>
        <Card
          image={wbtcicon}
          title="WBTC"
          description={outTokenPrice.toFixed(2)}
          value={outAmount.toString()}
          extra={`$${outAmountUsd.toFixed(2)}`}
        />
      </Section>
      <Section>
        <Row label="Estimated fee">
          <Text>{`$${fee}`}</Text>
        </Row>
        <Row label="Estimated time" tooltip="The estimated time of the TX">
          <Text>~10m</Text>
        </Row>
      </Section>
      <Section>
        <Text alignment="center">
          {userFriendlyStatus ? userFriendlyStatus : 'NA'}
        </Text>
      </Section>
    </Box>
  );
};

export default SwapProgress;
