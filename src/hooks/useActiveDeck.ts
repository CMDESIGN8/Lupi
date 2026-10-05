import { useCallback, useEffect, useState } from "react";
import { cardApi } from "../lib/api";
import { supabase } from "../lib/supabaseClient";
import type { AppUser } from "../lib/api";
import type { Deck, UserCard } from "../types/cards";

const emptyDeck = (userId = ""): Deck => ({
  id: "",
  user_id: userId,
  name: "Mi Mazo",
  is_active: true,
  cards: [],
});

export function useActiveDeck(user: AppUser | null) {
  const [activeDeck, setActiveDeck] = useState<Deck>(() => emptyDeck(user?.id));

  const loadActiveDeck = useCallback(async () => {
    if (!user) return;

    let { data: deck } = await supabase
      .from("decks")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!deck) {
      const { data: created, error } = await supabase
        .from("decks")
        .insert({ user_id: user.id, name: "Mi Mazo", is_active: true })
        .select()
        .single();

      if (error || !created) {
        setActiveDeck(emptyDeck(user.id));
        return;
      }
      deck = created;
    }

    const { data: deckCards } = await supabase
      .from("deck_cards")
      .select("user_card_id, position")
      .eq("deck_id", deck.id)
      .order("position");

    if (!deckCards) {
      setActiveDeck({ ...emptyDeck(user.id), id: deck.id });
      return;
    }

    const userCards = await cardApi.getUserCards(user.id);
    const cardsInDeck = deckCards
      .map((dc) => {
        const card = userCards.find((uc) => uc.id === dc.user_card_id);
        return card ? { ...card, position: dc.position } : null;
      })
      .filter(Boolean) as UserCard[];

    setActiveDeck({
      id: deck.id,
      user_id: deck.user_id,
      name: deck.name,
      is_active: deck.is_active,
      cards: cardsInDeck,
    });
  }, [user]);

  useEffect(() => {
    void loadActiveDeck();
  }, [loadActiveDeck]);

  return { activeDeck, setActiveDeck, loadActiveDeck };
}
