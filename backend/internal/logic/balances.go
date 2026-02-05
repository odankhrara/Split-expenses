package logic

import (
	"database/sql"
	"fmt"
)

func ComputeBalances(db *sql.DB, groupID int64) (map[int64]int64, error) {
	paidRows, err := db.Query(`
		SELECT payer_id, COALESCE(SUM(amount_cents), 0) FROM expenses WHERE group_id = ? GROUP BY payer_id
	`, groupID)
	if err != nil {
		return nil, err
	}
	defer paidRows.Close()
	paid := make(map[int64]int64)
	for paidRows.Next() {
		var uid int64
		var sum int64
		if err := paidRows.Scan(&uid, &sum); err != nil {
			return nil, err
		}
		paid[uid] = sum
	}

	shareRows, err := db.Query(`
		SELECT es.user_id, COALESCE(SUM(es.amount_cents), 0)
		FROM expense_splits es
		JOIN expenses e ON e.id = es.expense_id AND e.group_id = ?
		GROUP BY es.user_id
	`, groupID)
	if err != nil {
		return nil, err
	}
	defer shareRows.Close()
	share := make(map[int64]int64)
	for shareRows.Next() {
		var uid int64
		var sum int64
		if err := shareRows.Scan(&uid, &sum); err != nil {
			return nil, err
		}
		share[uid] = sum
	}

	sentRows, err := db.Query(`
		SELECT from_user_id, COALESCE(SUM(amount_cents), 0) FROM settlements WHERE group_id = ? GROUP BY from_user_id
	`, groupID)
	if err != nil {
		return nil, err
	}
	defer sentRows.Close()
	sent := make(map[int64]int64)
	for sentRows.Next() {
		var uid int64
		var sum int64
		if err := sentRows.Scan(&uid, &sum); err != nil {
			return nil, err
		}
		sent[uid] = sum
	}

	recvRows, err := db.Query(`
		SELECT to_user_id, COALESCE(SUM(amount_cents), 0) FROM settlements WHERE group_id = ? GROUP BY to_user_id
	`, groupID)
	if err != nil {
		return nil, err
	}
	defer recvRows.Close()
	recv := make(map[int64]int64)
	for recvRows.Next() {
		var uid int64
		var sum int64
		if err := recvRows.Scan(&uid, &sum); err != nil {
			return nil, err
		}
		recv[uid] = sum
	}

	memRows, err := db.Query(`SELECT user_id FROM group_members WHERE group_id = ?`, groupID)
	if err != nil {
		return nil, err
	}
	defer memRows.Close()
	balances := make(map[int64]int64)
	for memRows.Next() {
		var uid int64
		if err := memRows.Scan(&uid); err != nil {
			return nil, err
		}
		balances[uid] = paid[uid] - share[uid] - sent[uid] + recv[uid]
	}
	return balances, nil
}

func DistributeEvenSplit(amountCents int64, userIDs []int64) (map[int64]int64, error) {
	if amountCents <= 0 || len(userIDs) == 0 {
		return nil, fmt.Errorf("invalid even split: amount=%d users=%d", amountCents, len(userIDs))
	}
	n := int64(len(userIDs))
	base := amountCents / n
	rem := amountCents % n
	out := make(map[int64]int64)
	for i, uid := range userIDs {
		out[uid] = base
		if int64(i) < rem {
			out[uid]++
		}
	}
	return out, nil
}
