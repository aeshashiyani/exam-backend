function QuestionCard({ question, index, onSelect }) {
  return (
    <div style={{
      border: "1px solid #ccc",
      padding: 15,
      marginBottom: 15,
      borderRadius: 8
    }}>
      <h3>{index + 1}. {question.question}</h3>

      {question.options.map((opt, i) => (
        <div key={i}>
          <input
            type="radio"
            name={`q${index}`}
            onChange={() => onSelect(index, opt)}
          />
          {opt}
        </div>
      ))}
    </div>
  );
}

export default QuestionCard;