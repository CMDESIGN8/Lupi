import { useCallback, useEffect, useRef, useState } from "react";
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
  const [loadingDeck, setLoadingDeck] = useState(true);
  const [deckError, setDeckError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadActiveDeck = useCallback(async () => {
    if (!user || loadingRef.current) return;
    loadingRef.current = true;
    setLoadingDeck(true);
    setDeckError(null);
    try {
    let { data: deck, error: deckErrorResponse } = await supabase
      .from("decks")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (deckErrorResponse) throw deckErrorResponse;
    if (!deck) {
      const { data: created, error } = await supabase
        .from("decks")
        .insert({ user_id: user.id, name: "Mi Mazo", is_active: true })
        .select()
        .single();

      if (error || !created) {
        throw error ?? new Error("No se pudo crear el mazo");
      }
      deck = created;
    }

    let { data: deckCards, error: deckCardsError } = await supabase
      .from("deck_cards")
      .select("user_card_id, position")
      .eq("deck_id", deck.id)
      .order("position");

    if (deckCardsError) {
      throw deckCardsError;
    }

    if (!deckCards) {
      setActiveDeck({ ...emptyDeck(user.id), id: deck.id });
      return;
    }

    const userCards = await cardApi.getUserCards(user.id);
    // El debut necesita cinco posiciones válidas (1..5), no índices 0..4.
    // No reemplazamos un mazo existente: solamente inicializamos uno vacío.
    if (deckCards.length === 0 && userCards.length >= 5) {
      const slots = ["arquero", "cierre", "ala", "ala", "pivot"];
      const used = new Set<string>();
      const selection = slots.map((wanted, index) => {
        const candidates = userCards.filter(c => !used.has(c.id));
        const best = candidates.sort((a, b) => {
          const score = (c: UserCard) => {
            const data = c.card ?? (c as UserCard & { player?: { position?: string; overall_rating?: number } }).player;
            return (data?.overall_rating ?? 0) + (data?.position === wanted ? 100 : 0);
          };
          return score(b) - score(a);
        })[0];
        if (!best) throw new Error("No hay suficientes cartas para el quinteto");
        used.add(best.id);
        return { deck_id: deck.id, user_card_id: best.id, position: index + 1 };
      });
      const { error: insertError } = await supabase.from("deck_cards").insert(selection);
      if (insertError) console.warn("Releyendo mazo tras inserción:", insertError);
      const refreshed = await supabase.from("deck_cards")
        .select("user_card_id, position")
        .eq("deck_id", deck.id).order("position");
      if (refreshed.error) throw refreshed.error;
      deckCards = refreshed.data ?? [];
      if (deckCards.length !== 5) throw new Error("No se pudo preparar el quinteto completo");
    }

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
    } catch (error) {
      console.error("Error cargando el equipo", error);
      setDeckError("No pudimos preparar tu equipo. Reintentá la sincronización.");
    } finally {
      loadingRef.current = false;
      setLoadingDeck(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadActiveDeck();
  }, [loadActiveDeck]);

  return { activeDeck, setActiveDeck, loadActiveDeck, loadingDeck, deckError };
}
