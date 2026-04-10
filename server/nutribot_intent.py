import re
from nltk.tokenize import RegexpTokenizer
from nltk.stem import PorterStemmer
from nltk.metrics.distance import edit_distance

from nutribot_responses import response


class AtRiskIntentEngine:
    def __init__(self):
        self.tokenizer = RegexpTokenizer(r"[a-zA-Z0-9\-']+")
        self.stemmer = PorterStemmer()

        # Controlled vocabulary for this engine
        self.vocabulary = {
            # action words
            "show", "list", "select", "get", "find", "display", "give",
            "count", "number", "total", "tell",
            "search", "locate", "identify", "look", "up", "lookup",
            "summarise", "summarize", "summary", "overview", "breakdown", "provide",

            # conversational / filler words
            "can", "could", "would", "you", "please", "kindly",
            "me", "all", "the", "in", "of", "for", "to", "who",
            "which", "what", "are", "is", "there", "any",
            "how", "many", "do", "have",
            "not", "was", "were", "with", "from", "that",
            "has", "did", "over", "your",
            "most",
            "no", "without", "still", "been",

            # subject words
            "student", "students", "learner", "learners",
            "pupil", "pupils", "child", "children",

            # risk words
            "risk", "risky", "atrisk",

            # bmi-related terms
            "underweight", "normal", "overweight", "bmi",

            # summary / nutrition-status words
            "nutrition", "nutritional", "status",

            # bmi history / trend words
            "history", "trend", "change", "changed", "changes",
            "past", "previous", "record", "records",
            "measurement", "measurements", "time",
            "entry", "entries", "missing", "need", "needs", "measured",

            # absence / feeding-session words
            "absent", "missed", "present", "recent", "recently",
            "latest", "last", "feeding", "session",

            # latest/current bmi words
            "current", "newest",

            # section words
            "section", "sec",

            # help / capability words
            "help", "capability", "capabilities",
            "sample", "samples", "question", "questions",
            "ask", "example", "examples",
        }

        # Canonical replacements
        self.synonym_map = {
            "learners": "students",
            "learner": "student",
            "pupils": "students",
            "pupil": "student",
            "children": "students",
            "child": "student",

            "show": "list",
            "select": "list",
            "display": "list",
            "find": "list",
            "give": "list",
            "get": "list",
            "search": "find",
            "locate": "find",
            "identify": "find",
            "lookup": "find",
            "summarize": "summarise",
            "summary": "summarise",

            "number": "count",
            "total": "count",
            "sec": "section",
            "risky": "risk",
            "atrisk": "risk",
            "missed": "absent",
            "recently": "recent",
            "latest": "recent",
            "last": "recent",
            "newest": "recent",
            "nutritional": "nutrition",
            "changed": "change",
            "changes": "change",
            "records": "record",
            "measurements": "measurement",
            "previous": "past",
            "entries": "entry",
            "needs": "need",
            "measured": "measurement",
            "capabilities": "capability",
            "samples": "sample",
            "questions": "question",
            "examples": "example",
        }

    def preprocess(self, text: str) -> dict:
        """
        Preprocess user text:
        - preserve original text for entity extraction
        - lowercase
        - normalise 'at risk' / 'at-risk'
        - tokenise
        - typo-correct known words
        - map synonyms to canonical forms
        - stem tokens
        """
        original_text = text.strip()
        original_tokens = self.tokenizer.tokenize(original_text)
        raw_text = original_text.lower()

        # Normalise "at risk" phrases
        raw_text = raw_text.replace("at-risk", "atrisk")
        raw_text = re.sub(r"\bat\s+risk\b", "atrisk", raw_text)

        raw_text = re.sub(r"\s+", " ", raw_text)

        raw_tokens = self.tokenizer.tokenize(raw_text)
        corrected_tokens = [self.correct_token(token) for token in raw_tokens]
        canonical_tokens = [self.synonym_map.get(token, token) for token in corrected_tokens]
        stems = [self.stemmer.stem(token) for token in canonical_tokens]

        return {
            "original_text": original_text,
            "original_tokens": original_tokens,
            "raw_text": raw_text,
            "raw_tokens": raw_tokens,
            "corrected_tokens": corrected_tokens,
            "canonical_tokens": canonical_tokens,
            "stems": stems,
        }

    def correct_token(self, token: str) -> str:
        """
        Apply light typo tolerance against known vocabulary only.
        Example:
        - studnts -> students
        - undrweight -> underweight
        - secton -> section
        """
        if token in self.vocabulary:
            return token

        # Avoid changing very short tokens, numbers, or likely names
        if len(token) <= 2 or token.isdigit():
            return token

        candidates = [
            vocab_word
            for vocab_word in self.vocabulary
            if abs(len(vocab_word) - len(token)) <= 2
        ]

        if not candidates:
            return token

        best_match = min(candidates, key=lambda word: edit_distance(token, word))
        distance = edit_distance(token, best_match)

        threshold = 1 if len(token) <= 4 else 2

        if distance <= threshold:
            return best_match

        return token

    def extract_entities(self, canonical_tokens: list[str]) -> dict:
        """
        Extract entities used by the current intent set.
        """
        entities = {
            "risk_types": [],
            "bmi_category": None,
            "section": None,
            "absence_context": None,
            "summary_scope": None,
            "history_scope": None,
            "bmi_scope": None,
            "measurement_scope": None,
            "help_scope": None,
        }

        bmi_categories = []
        invalid_section_labels = {
            "summarise", "overview", "breakdown", "nutrition", "bmi", "status",
            "student", "students", "risk", "count", "total", "section",
        }

        # Detect section
        for i, token in enumerate(canonical_tokens):
            if token == "section" and i + 1 < len(canonical_tokens):
                next_token = canonical_tokens[i + 1]
                if re.fullmatch(r"[a-z0-9]+", next_token) and next_token not in invalid_section_labels:
                    entities["section"] = f"Section {next_token.upper()}"
                    break

        # Detect explicit risk types
        if "underweight" in canonical_tokens:
            entities["risk_types"].append("underweight")
            bmi_categories.append("underweight")

        if "normal" in canonical_tokens:
            bmi_categories.append("normal")

        if "overweight" in canonical_tokens:
            entities["risk_types"].append("overweight")
            bmi_categories.append("overweight")

        # If user only said "at risk", default to both
        if not entities["risk_types"] and "risk" in canonical_tokens:
            entities["risk_types"] = ["underweight", "overweight"]

        if len(bmi_categories) == 1:
            entities["bmi_category"] = bmi_categories[0]

        has_not_present = any(
            canonical_tokens[i] == "not" and canonical_tokens[i + 1] == "present"
            for i in range(len(canonical_tokens) - 1)
        )
        has_recent_feeding = "recent" in canonical_tokens and "feeding" in canonical_tokens

        if "absent" in canonical_tokens or has_not_present or has_recent_feeding:
            entities["absence_context"] = "latest_feeding_session"

        has_missing_measurement_marker = (
            "missing" in canonical_tokens
            or "without" in canonical_tokens
            or "no" in canonical_tokens
            or "need" in canonical_tokens
            or any(
                canonical_tokens[i] == "not" and canonical_tokens[i + 1] in {"measurement", "recent"}
                for i in range(len(canonical_tokens) - 1)
            )
        )
        has_measurement_reference = (
            "measurement" in canonical_tokens
            or "bmi" in canonical_tokens
            or "record" in canonical_tokens
            or "entry" in canonical_tokens
        )
        has_recent_measurement_reference = (
            ("recent" in canonical_tokens and has_measurement_reference)
            or ("measurement" in canonical_tokens and "recent" in canonical_tokens)
            or ("bmi" in canonical_tokens and "entry" in canonical_tokens)
            or ("bmi" in canonical_tokens and "record" in canonical_tokens)
        )
        if has_missing_measurement_marker and (has_recent_measurement_reference or "measurement" in canonical_tokens):
            entities["measurement_scope"] = "missing_recent_measurement"

        has_summary_signal = any(
            token in {"summarise", "overview", "breakdown"}
            for token in canonical_tokens
        )
        has_nutrition_signal = any(
            token in {"nutrition", "bmi", "status"}
            for token in canonical_tokens
        )
        if entities["section"] and (has_summary_signal or has_nutrition_signal):
            entities["summary_scope"] = "nutrition_status_breakdown"

        has_latest_bmi_signal = (
            "current" in canonical_tokens
            or "recent" in canonical_tokens
            or ("most" in canonical_tokens and "recent" in canonical_tokens)
        )
        has_history_signal = any(
            token in {"history", "trend", "change", "past", "measurement"}
            for token in canonical_tokens
        ) or ("record" in canonical_tokens and not has_latest_bmi_signal)
        has_bmi_history_context = (
            "bmi" in canonical_tokens
            or "measurement" in canonical_tokens
            or "record" in canonical_tokens
            or ("over" in canonical_tokens and "time" in canonical_tokens)
        )
        if has_history_signal and has_bmi_history_context and entities["measurement_scope"] is None:
            entities["history_scope"] = "bmi_history"
        has_bmi_latest_context = (
            "bmi" in canonical_tokens
            or "status" in canonical_tokens
            or "record" in canonical_tokens
        )
        if (
            has_latest_bmi_signal
            and has_bmi_latest_context
            and entities["history_scope"] is None
            and entities["measurement_scope"] is None
        ):
            entities["bmi_scope"] = "latest_bmi"

        has_what_can_you_do = any(
            canonical_tokens[i:i + 4] == ["what", "can", "you", "do"]
            for i in range(len(canonical_tokens) - 3)
        )
        has_sample_question_request = (
            "sample" in canonical_tokens
            and ("question" in canonical_tokens or "ask" in canonical_tokens)
        )
        has_capability_request = (
            "help" in canonical_tokens
            or "capability" in canonical_tokens
            or has_what_can_you_do
            or has_sample_question_request
            or ("example" in canonical_tokens and "question" in canonical_tokens)
        )
        if has_capability_request:
            entities["help_scope"] = "capabilities"

        return entities

    def extract_student_reference_entities(
        self,
        processed: dict,
        history_scope: str | None = None,
        bmi_scope: str | None = None,
    ) -> dict:
        """
        Extract a student name or numeric student ID for single-student lookups.
        """
        corrected_tokens = processed["corrected_tokens"]
        canonical_tokens = processed["canonical_tokens"]
        original_tokens = processed["original_tokens"]

        entities = {
            "student_name": None,
            "student_id": None,
        }

        if not corrected_tokens or len(corrected_tokens) != len(original_tokens):
            return entities

        role_words = {"student", "students", "learner", "learners", "pupil", "pupils", "child", "children"}
        excluded_target_tokens = {
            "risk", "risky", "underweight", "overweight", "normal", "bmi",
            "absent", "present", "recent", "feeding", "session", "section",
            "count", "number", "total", "list", "show", "find", "search",
            "locate", "identify", "look", "up", "who", "which", "what",
            "are", "is", "was", "were", "there", "how", "many",
            "history", "trend", "change", "past", "record", "measurement",
            "status", "nutrition", "overview", "breakdown", "summary",
        }
        history_stop_words = {"bmi", "history", "trend", "change", "past", "record", "measurement", "over", "time"}
        latest_stop_words = {"bmi", "recent", "current", "record", "status"}
        prefix_skip_words = {"for", "of", "the", "a", "an", "me"}
        triplets = list(zip(original_tokens, corrected_tokens, canonical_tokens))

        def normalise_name_token(token: str) -> str:
            return re.sub(r"(?:'s|')$", "", token)

        def build_entities(
            candidate_triplets: list[tuple[str, str, str]],
            stop_words: set[str],
        ) -> dict:
            if not candidate_triplets:
                return {"student_name": None, "student_id": None}

            while candidate_triplets and candidate_triplets[0][2] in prefix_skip_words:
                candidate_triplets = candidate_triplets[1:]

            while candidate_triplets and candidate_triplets[0][2] in role_words:
                candidate_triplets = candidate_triplets[1:]

            if not candidate_triplets:
                return {"student_name": None, "student_id": None}

            collected = []
            for original, corrected, canonical in candidate_triplets:
                if collected and canonical in stop_words:
                    break
                collected.append((normalise_name_token(original), normalise_name_token(corrected), canonical))

            if not collected:
                return {"student_name": None, "student_id": None}

            student_id = None
            if collected and collected[0][1].isdigit():
                student_id = collected[0][0]
                collected = collected[1:]

            student_name = None
            if collected:
                original_name_tokens = [original for original, _, _ in collected if original]
                corrected_name_tokens = [corrected for _, corrected, _ in collected if corrected and not corrected.isdigit()]
                has_keyword_noise = any(token in excluded_target_tokens for token in corrected_name_tokens)
                has_name_shape = any(token[:1].isupper() for token in original_name_tokens) or all(
                    token not in self.vocabulary for token in corrected_name_tokens
                )

                if (
                    original_name_tokens
                    and len(original_name_tokens) <= 4
                    and not has_keyword_noise
                    and has_name_shape
                ):
                    student_name = " ".join(original_name_tokens)

            return {
                "student_name": student_name,
                "student_id": student_id,
            }

        default_stop_words = (
            history_stop_words if history_scope == "bmi_history"
            else latest_stop_words if bmi_scope == "latest_bmi"
            else history_stop_words
        )
        candidate_sets = []

        if len(corrected_tokens) >= 2 and corrected_tokens[0] == "who" and corrected_tokens[1] == "is":
            candidate_sets.append((triplets[2:], default_stop_words))
        elif len(corrected_tokens) >= 2 and corrected_tokens[0] == "look" and corrected_tokens[1] == "up":
            candidate_sets.append((triplets[2:], default_stop_words))
        elif corrected_tokens[0] in {"find", "search", "locate", "identify", "lookup"}:
            candidate_sets.append((triplets[1:], default_stop_words))
        elif len(corrected_tokens) >= 2 and corrected_tokens[0] == "show" and canonical_tokens[1] == "student":
            candidate_sets.append((triplets[1:], default_stop_words))

        if history_scope == "bmi_history":
            for marker in {"of", "for"}:
                marker_indexes = [i for i, token in enumerate(canonical_tokens) if token == marker]
                if marker_indexes:
                    candidate_sets.append((triplets[marker_indexes[-1] + 1:], history_stop_words))

            for i, token in enumerate(canonical_tokens):
                if token == "student" and i + 1 < len(triplets):
                    candidate_sets.append((triplets[i + 1:], history_stop_words))

            history_markers = {"bmi", "history", "trend", "change", "past", "record", "measurement"}
            history_stops = {
                "how", "what", "show", "list", "give", "display", "tell", "find",
                "search", "locate", "identify", "look", "up", "me", "the",
                "is", "are", "has", "did", "of", "for",
            } | role_words
            anchor_index = next((i for i, token in enumerate(canonical_tokens) if token in history_markers), None)
            if anchor_index is not None and anchor_index > 0:
                reverse_slice = []
                for i in range(anchor_index - 1, -1, -1):
                    if canonical_tokens[i] in history_stops:
                        break
                    reverse_slice.append(triplets[i])
                if reverse_slice:
                    candidate_sets.append((list(reversed(reverse_slice)), history_stop_words))

        if bmi_scope == "latest_bmi":
            for marker in {"of", "for"}:
                marker_indexes = [i for i, token in enumerate(canonical_tokens) if token == marker]
                if marker_indexes:
                    candidate_sets.append((triplets[marker_indexes[-1] + 1:], latest_stop_words))

            for i, token in enumerate(canonical_tokens):
                if token == "student" and i + 1 < len(triplets):
                    candidate_sets.append((triplets[i + 1:], latest_stop_words))

            latest_markers = {"bmi", "recent", "current", "record", "status"}
            latest_stops = {
                "how", "what", "show", "list", "give", "display", "tell", "find",
                "search", "locate", "identify", "look", "up", "get", "me",
                "the", "is", "are", "has", "did", "of", "for", "most",
            } | role_words
            anchor_index = next((i for i, token in enumerate(canonical_tokens) if token in latest_markers), None)
            if anchor_index is not None and anchor_index > 0:
                reverse_slice = []
                for i in range(anchor_index - 1, -1, -1):
                    if canonical_tokens[i] in latest_stops:
                        break
                    reverse_slice.append(triplets[i])
                if reverse_slice:
                    candidate_sets.append((list(reversed(reverse_slice)), latest_stop_words))

        for candidate_triplets, stop_words in candidate_sets:
            extracted = build_entities(candidate_triplets, stop_words)
            if extracted["student_name"] or extracted["student_id"]:
                return extracted

        return entities

    def detect_intent(self, text: str) -> dict:
        """
        Detect the intent:
        - list_at_risk_students
        - count_at_risk_students
        - list_students_by_bmi_category
        - list_at_risk_recently_absent_students
        - find_student
        - summarise_section_nutrition_status
        - get_student_bmi_history
        - get_student_latest_bmi
        - list_students_missing_recent_measurement
        - show_nutribot_capabilities
        """
        processed = self.preprocess(text)
        canonical_tokens = processed["canonical_tokens"]
        tokens = set(canonical_tokens)
        stems = set(processed["stems"])
        corrected_tokens = processed["corrected_tokens"]

        entities = self.extract_entities(canonical_tokens)
        entities.update(
            self.extract_student_reference_entities(
                processed,
                entities["history_scope"],
                entities["bmi_scope"],
            )
        )

        student_stems = {
            self.stemmer.stem("student"),
            self.stemmer.stem("students"),
        }

        list_stems = {
            self.stemmer.stem("list"),
        }

        count_stems = {
            self.stemmer.stem("count"),
        }

        risk_stems = {
            self.stemmer.stem("risk"),
            self.stemmer.stem("underweight"),
            self.stemmer.stem("overweight"),
        }

        bmi_category_stems = {
            self.stemmer.stem("underweight"),
            self.stemmer.stem("normal"),
            self.stemmer.stem("overweight"),
        }
        lookup_role_words = {"student", "students", "learner", "learners", "pupil", "pupils", "child", "children"}

        list_question_words = {"who", "which"}
        has_how_many = any(
            canonical_tokens[i] == "how" and canonical_tokens[i + 1] == "many"
            for i in range(len(canonical_tokens) - 1)
        )
        has_who_is = len(corrected_tokens) >= 2 and corrected_tokens[0] == "who" and corrected_tokens[1] == "is"
        has_look_up = len(corrected_tokens) >= 2 and corrected_tokens[0] == "look" and corrected_tokens[1] == "up"
        has_show_student_lookup = (
            len(corrected_tokens) >= 2
            and corrected_tokens[0] == "show"
            and canonical_tokens[1] == "student"
        )

        has_student_signal = any(stem in stems for stem in student_stems)
        has_list_signal = any(stem in stems for stem in list_stems) or bool(tokens & list_question_words)
        has_count_signal = any(stem in stems for stem in count_stems) or has_how_many
        has_risk_signal = any(stem in stems for stem in risk_stems)
        has_explicit_at_risk_signal = self.stemmer.stem("risk") in stems
        has_specific_bmi_signal = any(stem in stems for stem in bmi_category_stems)
        has_single_bmi_category = entities["bmi_category"] is not None
        has_combined_risk_categories = set(entities["risk_types"]) == {"underweight", "overweight"}
        has_absence_signal = entities["absence_context"] == "latest_feeding_session"
        has_find_signal = (
            (corrected_tokens[0] in {"find", "search", "locate", "identify", "lookup"} if corrected_tokens else False)
            or has_who_is
            or has_look_up
            or has_show_student_lookup
        )
        has_find_target = bool(entities["student_name"] or entities["student_id"])
        has_lookup_subject_signal = has_who_is or has_show_student_lookup or (
            len(canonical_tokens) >= 2 and canonical_tokens[1] in lookup_role_words
        ) or (
            len(canonical_tokens) >= 3
            and corrected_tokens[0] == "look"
            and corrected_tokens[1] == "up"
            and canonical_tokens[2] in lookup_role_words
        )
        has_section_signal = entities["section"] is not None
        has_summary_signal = any(
            token in {"summarise", "overview", "breakdown"}
            for token in canonical_tokens
        )
        has_nutrition_signal = any(
            token in {"nutrition", "bmi", "status"}
            for token in canonical_tokens
        )
        has_summary_scope = entities["summary_scope"] == "nutrition_status_breakdown"
        has_history_scope = entities["history_scope"] == "bmi_history"
        has_bmi_scope = entities["bmi_scope"] == "latest_bmi"
        has_measurement_scope = entities["measurement_scope"] == "missing_recent_measurement"
        has_help_scope = entities["help_scope"] == "capabilities"
        has_what_can_you_do = any(
            canonical_tokens[i:i + 4] == ["what", "can", "you", "do"]
            for i in range(len(canonical_tokens) - 3)
        )
        has_sample_question_request = (
            "sample" in canonical_tokens
            and ("question" in canonical_tokens or "ask" in canonical_tokens)
        )
        has_help_signal = (
            "help" in canonical_tokens
            or "capability" in canonical_tokens
            or "example" in canonical_tokens
            or has_what_can_you_do
            or has_sample_question_request
        )

        list_confidence = 0.0
        if has_explicit_at_risk_signal or has_combined_risk_categories:
            list_confidence += 0.50
        if has_student_signal:
            list_confidence += 0.25
        if has_list_signal:
            list_confidence += 0.25

        count_confidence = 0.0
        if has_risk_signal:
            count_confidence += 0.50
        if has_student_signal:
            count_confidence += 0.25
        if has_count_signal:
            count_confidence += 0.25

        bmi_list_confidence = 0.0
        if has_single_bmi_category:
            bmi_list_confidence += 0.50
        if has_student_signal:
            bmi_list_confidence += 0.25
        if has_list_signal:
            bmi_list_confidence += 0.25

        absent_list_confidence = 0.0
        if has_risk_signal:
            absent_list_confidence += 0.50
        if has_absence_signal:
            absent_list_confidence += 0.25
        if has_student_signal or has_list_signal:
            absent_list_confidence += 0.25

        find_confidence = 0.0
        if has_find_signal:
            find_confidence += 0.50
        if has_lookup_subject_signal:
            find_confidence += 0.25
        if has_find_target:
            find_confidence += 0.25

        summary_confidence = 0.0
        if has_section_signal:
            summary_confidence += 0.50
        if has_summary_signal:
            summary_confidence += 0.25
        if has_nutrition_signal:
            summary_confidence += 0.25

        history_confidence = 0.0
        if has_history_scope:
            history_confidence += 0.50
        if "bmi" in canonical_tokens:
            history_confidence += 0.25
        if has_find_target:
            history_confidence += 0.25

        latest_bmi_confidence = 0.0
        if has_bmi_scope:
            latest_bmi_confidence += 0.50
        if "bmi" in canonical_tokens or "status" in canonical_tokens:
            latest_bmi_confidence += 0.25
        if has_find_target:
            latest_bmi_confidence += 0.25

        missing_measurement_confidence = 0.0
        if has_measurement_scope:
            missing_measurement_confidence += 0.50
        if has_student_signal or has_list_signal:
            missing_measurement_confidence += 0.25
        if has_section_signal:
            missing_measurement_confidence += 0.25

        capability_confidence = 0.0
        if has_help_scope:
            capability_confidence += 0.50
        if has_help_signal:
            capability_confidence += 0.25
        if has_what_can_you_do or has_sample_question_request:
            capability_confidence += 0.25

        list_matched = (has_explicit_at_risk_signal or has_combined_risk_categories) and (
            has_list_signal or (has_student_signal and not has_count_signal)
        )
        count_matched = has_count_signal and has_risk_signal
        absent_list_matched = (
            has_risk_signal
            and has_absence_signal
            and not has_count_signal
            and (has_list_signal or has_student_signal)
        )
        bmi_list_matched = (
            has_single_bmi_category
            and has_specific_bmi_signal
            and not has_explicit_at_risk_signal
            and not has_absence_signal
            and not has_count_signal
            and (has_list_signal or has_student_signal)
        )
        find_matched = has_find_signal and has_find_target
        summary_matched = (
            has_section_signal
            and has_summary_scope
            and not has_student_signal
            and not has_count_signal
            and not has_find_target
        )
        history_matched = (
            has_history_scope
            and has_find_target
            and not has_section_signal
        )
        latest_bmi_matched = (
            has_bmi_scope
            and has_find_target
            and not has_section_signal
        )
        missing_measurement_matched = (
            has_measurement_scope
            and not has_find_target
            and (has_student_signal or has_list_signal)
        )
        capability_matched = has_help_scope and not has_find_target and not has_section_signal

        intent = None
        confidence = 0.0
        matched = False

        if capability_matched:
            intent = "show_nutribot_capabilities"
            confidence = capability_confidence
            matched = True
        elif history_matched:
            intent = "get_student_bmi_history"
            confidence = history_confidence
            matched = True
        elif latest_bmi_matched:
            intent = "get_student_latest_bmi"
            confidence = latest_bmi_confidence
            matched = True
        elif find_matched:
            intent = "find_student"
            confidence = find_confidence
            matched = True
        elif missing_measurement_matched:
            intent = "list_students_missing_recent_measurement"
            confidence = missing_measurement_confidence
            matched = True
        elif summary_matched:
            intent = "summarise_section_nutrition_status"
            confidence = summary_confidence
            matched = True
        elif count_matched and count_confidence >= list_confidence:
            intent = "count_at_risk_students"
            confidence = count_confidence
            matched = True
        elif absent_list_matched and absent_list_confidence >= bmi_list_confidence:
            intent = "list_at_risk_recently_absent_students"
            confidence = absent_list_confidence
            matched = True
        elif bmi_list_matched and bmi_list_confidence >= list_confidence:
            intent = "list_students_by_bmi_category"
            confidence = bmi_list_confidence
            matched = True
        elif list_matched:
            intent = "list_at_risk_students"
            confidence = list_confidence
            matched = True

        processed["signals"] = {
            "has_student_signal": has_student_signal,
            "has_list_signal": has_list_signal,
            "has_count_signal": has_count_signal,
            "has_risk_signal": has_risk_signal,
            "has_explicit_at_risk_signal": has_explicit_at_risk_signal,
            "has_specific_bmi_signal": has_specific_bmi_signal,
            "has_single_bmi_category": has_single_bmi_category,
            "has_absence_signal": has_absence_signal,
            "has_find_signal": has_find_signal,
            "has_find_target": has_find_target,
            "has_section_signal": has_section_signal,
            "has_summary_signal": has_summary_signal,
            "has_nutrition_signal": has_nutrition_signal,
            "has_summary_scope": has_summary_scope,
            "has_history_scope": has_history_scope,
            "has_bmi_scope": has_bmi_scope,
            "has_measurement_scope": has_measurement_scope,
            "has_help_scope": has_help_scope,
            "has_help_signal": has_help_signal,
        }
        processed["scores"] = {
            "list_at_risk_students": round(list_confidence, 2),
            "count_at_risk_students": round(count_confidence, 2),
            "list_students_by_bmi_category": round(bmi_list_confidence, 2),
            "list_at_risk_recently_absent_students": round(absent_list_confidence, 2),
            "find_student": round(find_confidence, 2),
            "summarise_section_nutrition_status": round(summary_confidence, 2),
            "get_student_bmi_history": round(history_confidence, 2),
            "get_student_latest_bmi": round(latest_bmi_confidence, 2),
            "list_students_missing_recent_measurement": round(missing_measurement_confidence, 2),
            "show_nutribot_capabilities": round(capability_confidence, 2),
        }

        return {
            "intent": intent,
            "matched": matched,
            "confidence": round(confidence, 2),
            "entities": entities,
            "debug": processed,
        }


ENGINE = AtRiskIntentEngine()


def prompt_message(user_input: str, teacher_id: int | str | None = None) -> dict | None:
    """
    Accept a prompt string and return the generated query payload, if any.
    """
    prompt = str(user_input or "").strip()
    if not prompt:
        return None

    intent_result = ENGINE.detect_intent(prompt)
    intent_result["teacher_id"] = teacher_id
    return response(intent_result)


if __name__ == "__main__":
    sample_queries = [
        "which students have no recent measurement",
        "show students missing BMI records",
        "who still needs to be measured",
        "list students without recent BMI",
        "show students without a recent measurement in section a",
        "what is Maria Santos' latest BMI",
        "show the latest BMI of John Cruz",
        "what is student 1023's current BMI",
        "give me the most recent BMI of Anna Reyes",
        "show me the newest BMI record of Carla Mendoza",
        "show BMI history of Maria Santos",
        "what is the BMI history of John Cruz",
        "how has Maria's BMI changed",
        "show me the BMI trend of student 1023",
        "give me the measurement history of Anna Reyes",
        "summarise section a",
        "give me the nutrition summary of section b",
        "show the BMI status breakdown of sec c",
        "section 1 nutrition overview",
        "provide a section summary for section a",
        "find Maria Santos",
        "search student John Cruz",
        "who is student 1023",
        "locate learner Anna Reyes",
        "look up Pedro Dela Cruz",
        "find studnt Carla Mendoza",
        "how many at risk students are there",
        "count underwight studnts",
        "what is the total number of overweight students in sec a",
        "how many risky pupils are in section b",
        "show at risk students who were recently absent",
        "list absent at risk students",
        "which underweight students were absent in the latest feeding session",
        "show overweight students absent from feeding",
        "display underwight studnts absent in sec a",
        "show at risk students",
        "list underweight students",
        "show overweight students in section a",
        "which students are normal",
        "display underwight studnts in sec b",
        "show students with normal bmi",
        "show underweight students in section a",
        "count underweight students",
        "what can you do",
        "what is your capability",
        "sample questions to ask",
        "help",
    ]

    print("At-Risk Intent Tester")
    print("Type your message below. Type 'quit' to exit.\n")
    print("Sample classifications:")

    for query in sample_queries:
        result = ENGINE.detect_intent(query)
        # print(f"- {query}")
        # print(f"  intent={result['intent']}, confidence={result['confidence']}, entities={result['entities']}")

    print()

    while True:
        user_input = input("You: ").strip()

        if user_input.lower() in {"quit", "exit", "bye"}:
            print("Bot: Goodbye!")
            break

        result = ENGINE.detect_intent(user_input)
        
        if result["matched"]:
            print("\nMatched intent:", result["intent"])
            print("Confidence:", result["confidence"])
            print("Entities:", result["entities"])
            # print("Canonical tokens:", result["debug"]["canonical_tokens"])

            query_payload = response(result) 
            if query_payload is None:
                continue

            if "sql" in query_payload:
                print(query_payload["sql"])
                print(query_payload["params"])
            elif query_payload.get("response_type") == "capabilities":
                print(query_payload["title"])
                for capability in query_payload["capabilities"]:
                    print(f"\n{capability['intent']}")
                    for sample in capability["sample_questions"]:
                        print(f"- {sample}")
        else:
            print("\nBot: I did not recognise that as an at-risk student query.\n")
