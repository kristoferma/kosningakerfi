const electionResults = require('./../data/2017.json').map(constituency => {
  delete constituency.result.auð
  delete constituency.result.ógild
  return constituency
})

const constituencySeats = {
  NV: 7,
  NA: 9,
  SU: 9,
  SV: 11,
  RS: 9,
  RN: 9
}

const jofnunarsaeti = {
  NV: 1,
  NA: 1,
  SU: 1,
  SV: 2,
  RS: 2,
  RN: 2
}

function calculateVotes({ name, shortname, result }) {
  const seatsInConstituency = constituencySeats[shortname]
  const parties = Object.keys(result)
  return {
    name,
    shortname,
    seatsAmount: seatsInConstituency,
    votes: parties.map(party => ({
      party: party,
      votesPerSeat: [...Array(seatsInConstituency)].map(
        (value, index) => result[party] / (index + 1)
      )
    }))
  }
}

function calculateConsituencySeats({ name, shortname, votes, seatsAmount }) {
  let seats = []
  votes.forEach(({ party, votesPerSeat }) =>
    votesPerSeat.forEach(vote => seats.push({ party, vote }))
  )
  seats = seats.sort((a, b) => b.vote - a.vote)
  return {
    name,
    shortname,
    seats,
    seatsAmount
  }
}

const votesPerConstituency = electionResults.map(constituency =>
  calculateVotes(constituency)
)

const seatsPerConstituency = votesPerConstituency.map(constituencyVotes =>
  calculateConsituencySeats(constituencyVotes)
)

const finalConstituencySeats = seatsPerConstituency.map(
  ({ name, shortname, seats, seatsAmount }) => ({
    name,
    shortname,
    seats: seats.slice(0, seatsAmount)
  })
)

const totalSeatsPerParty = {}

finalConstituencySeats.forEach(constituency =>
  constituency.seats.forEach(
    ({ party }) =>
      totalSeatsPerParty[party]
        ? (totalSeatsPerParty[party] += 1)
        : (totalSeatsPerParty[party] = 1)
  )
)

const totalVotesPerParty = { total: 0 }
electionResults.forEach(({ result }) =>
  Object.keys(result).forEach(party => {
    const votes = result[party]
    totalVotesPerParty[party]
      ? (totalVotesPerParty[party] += votes)
      : (totalVotesPerParty[party] = votes)
    totalVotesPerParty.total += votes
  })
)

const percentagePerParty = Object.keys(totalVotesPerParty).reduce(
  (acc, party) => {
    if (party == 'total') return acc
    acc[party] = totalVotesPerParty[party] / totalVotesPerParty.total
    return acc
  },
  {}
)

const PERCENTAGE_THRESHOLD = 0.05

const partiesQualifiedForEqualizationSeat = Object.keys(
  percentagePerParty
).reduce(
  (acc, party) =>
    percentagePerParty[party] > PERCENTAGE_THRESHOLD ? acc.concat(party) : acc,
  []
)

const EQUALIZATION_SEATS_AMOUNT = 9

const equalizationSeats = partiesQualifiedForEqualizationSeat
  .map(party =>
    [...Array(EQUALIZATION_SEATS_AMOUNT)].map((value, index) => ({
      party,
      votes:
        totalVotesPerParty[party] /
        ((totalSeatsPerParty[party] || 0) + index + 1)
    }))
  )
  .reduce((a, b) => a.concat(b))
  .sort((a, b) => b.votes - a.votes)
  .slice(0, EQUALIZATION_SEATS_AMOUNT)

const totalSeatsPerPartyWithEqualizationSeats = equalizationSeats.reduce(
  (totalSeats, { party }) => {
    totalSeats[party] ? (totalSeats[party] += 1) : (totalSeats[party] = 1)
    return totalSeats
  },
  totalSeatsPerParty
)

console.log(JSON.stringify(percentagePerParty, null, 2))
console.log(JSON.stringify(totalSeatsPerPartyWithEqualizationSeats, null, 2))
