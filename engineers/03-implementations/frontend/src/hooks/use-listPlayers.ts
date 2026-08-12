// AUTO-GENERATED for Frontend Admin Player Selection
// Source: backend GraphQL schema (query: listPlayers)

import { useQuery } from '@tanstack/react-query';
import { gql, request } from 'graphql-request';
import { GRAPHQL_ENDPOINT } from '@/lib/graphql-client';
import type { PlayerResponse } from './use-whoami';

const LIST_PLAYERS_QUERY = gql`
  query listPlayers {
    listPlayers {
      id
      gcpIapEmail
      isAdmin
      wallet {
        id
        dailyFreeCredit
        adminBonusCredit
        totalCredits
      }
    }
  }
`;

export const listPlayersKeys = {
  all: ['listPlayers'] as const,
};

export function useListPlayers(enabled = true) {
  return useQuery({
    queryKey: listPlayersKeys.all,
    queryFn: () =>
      request<{ listPlayers: PlayerResponse[] }>(
        GRAPHQL_ENDPOINT,
        LIST_PLAYERS_QUERY
      ).then((data) => data.listPlayers),
    enabled,
  });
}
